// log.ts (scoped, immutable, per-execution JSON arrays)
// Reemplaza tu archivo actual con este para evitar duplicaciones en la jerarquía.
// Ahora se escribe un archivo JSON por ejecución, en lugar de NDJSON por día.
// Se eliminó el campo routineId para simplificar.

import { RunCtx } from '@common/types/commons.type';
import fs from 'fs/promises';
import path from 'path';

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

type LogMeta = {
  path?: string[];
  traceId?: string;
  routineName?: string;
  [k: string]: any;
};

export class Log {
  source: string;
  verbose: boolean;
  writeToFile: boolean;

  // Meta inmutable: nunca se muta; child() crea copia nueva
  #meta: LogMeta;

  // Cola para serializar escrituras a archivo y evitar condiciones de carrera
  #writeQueue: Promise<void> = Promise.resolve();

  #seenExecIds: Set<string> = new Set();
  #openedExecutions: Set<string> = new Set();
  #needsComma: Set<string> = new Set();

  constructor(
    source: string,
    verbose: boolean = false,
    writeToFile: boolean = true,
    meta: LogMeta = {}
  ) {
    this.source = source;
    this.verbose = verbose;
    this.writeToFile = writeToFile;
    this.#meta = {
      ...meta,
      path: meta.path ? [...meta.path] : [],
    };
  }

  info(message: string, data?: any, runCtx?: RunCtx)  { return this.#emit('info',  message, data, runCtx); }
  warn(message: string, data?: any, runCtx?: RunCtx)  { return this.#emit('warn',  message, data, runCtx); }
  error(message: string, data?: any, runCtx?: RunCtx) { return this.#emit('error', message, data, runCtx); }
  debug(message: string, data?: any, runCtx?: RunCtx) { return this.#emit('debug', message, data, runCtx); }


async #emit(level: LogLevel, message: string, data?: any, runCtx?: RunCtx ): Promise<string> {
  // ---- Prefijo para consola (opcional) ----
  const { hierarchy, executionId } = runCtx || {};
  const routineName = (runCtx as any)?.routineName;

  let line = '';
  
  if (executionId) {
    line += `[exec:${executionId}] `;
  }

  line += `[${new Date().toISOString()}] [${level.toUpperCase()}] `;


  if (hierarchy && hierarchy.length > 0) {
    line += `[${hierarchy.map(h => `${h.type}:${h.name}`).join(' / ')}] `;
  } else {
    line += `[${this.source}] `;
  }
  line += message;

  if (this.verbose) {
    this.#writeToConsole(level, line);
  }

  if (!this.writeToFile) return message;

  // ---- Serialización segura ----
  const safe = (value: any) => {
    try {
      if (value === undefined || value === null) return value;
      // Para primitivos no hace falta tocar nada
      const t = typeof value;
      if (t === 'string' || t === 'number' || t === 'boolean') return value;

      const seen = new WeakSet();
      const json = JSON.stringify(value, (_k, v) => {
        if (v instanceof Error) {
          return { name: v.name, message: v.message, stack: v.stack };
        }
        if (typeof v === 'bigint') {
          // JSON no soporta BigInt → pasarlo a string
          return v.toString();
        }
        if (typeof v === 'function') {
          return `[Function ${v.name || 'anonymous'}]`;
        }
        if (typeof v === 'symbol') {
          return v.toString();
        }
        if (typeof v === 'object' && v !== null) {
          if (seen.has(v)) return '[Circular]';
          seen.add(v);
        }
        return v;
      });

      // Si JSON.stringify devolvió undefined (p. ej. un valor top-level no serializable)
      if (json === undefined) return undefined;

      // Devolvemos objeto/array plano para que entry -> JSON.stringify(entry) no doble-encodee
      return JSON.parse(json);
    } catch (e: any) {
      return `[Unserializable: ${e?.message ?? String(e)}]`;
    }
  };

  // Hora local HH:mm:ss:SSS (la fecha va en el nombre del archivo)
  const d = new Date();
  const time =
    `${String(d.getHours()).padStart(2, '0')}:` +
    `${String(d.getMinutes()).padStart(2, '0')}:` +
    `${String(d.getSeconds()).padStart(2, '0')}:` +
    `${String(d.getMilliseconds()).padStart(3, '0')}`;

  const depth = Array.isArray(hierarchy) ? hierarchy.length : 0;
  const lastSeg = depth > 0 ? hierarchy![depth - 1] : undefined;
  const nodeType = lastSeg?.type ?? 'routine';
  const nodeName = lastSeg?.name ?? routineName ?? this.source;
  const pretty = `${'  '.repeat(depth)}${time} - ${nodeName} - ${message}`;

  // Rutas y archivo por día
  const safeSource = this.source.replace(/[^a-zA-Z0-9]/g, '_');
  const logDir = path.resolve('./logs', safeSource);
  const safeDate = (() => {
    const d = new Date();
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  })();

  const execDir = path.join(logDir, safeDate);
  const filePath = path.join(execDir, `${executionId ?? 'no-exec'}.json`);

  if (!executionId) {
    // fallback: don’t write file without an executionId root
    return message;
  }

  const entry = {
    time,
    level,
    source: this.source,
    message,
    data: safe(data),
    routineName: routineName ?? undefined,
    depth,
    nodeType,
    nodeName,
    path: hierarchy?.map(h => ({ type: h.type, name: h.name })),
    pretty,
  } as const;

  await this.#enqueue(async () => {
    await fs.mkdir(execDir, { recursive: true });
    // If this is the first time we see this execution, write the opening '['
    const firstTime = !this.#openedExecutions.has(executionId);
    if (firstTime) {
      await fs.writeFile(filePath, '[\n', { flag: 'wx' }).catch(async (err) => {
        // If file exists already (e.g., concurrent start), ensure it has an opening bracket
        if ((err as any).code !== 'EEXIST') throw err;
      });
      this.#openedExecutions.add(executionId);
      this.#needsComma.delete(executionId);
    }

    // If a comma is needed before next element, write it
    if (this.#needsComma.has(executionId)) {
      await fs.appendFile(filePath, ',\n', 'utf-8');
    }

    // Append the event
    await fs.appendFile(filePath, JSON.stringify(entry), 'utf-8');
    // Next append will require a comma
    this.#needsComma.add(executionId);
  });

  return message;
}

  #writeToConsole(level: LogLevel, line: string) {
    if (!this.verbose && level === 'debug') return;
    if (level === 'error') console.error(line);
    else if (level === 'warn') console.warn(line);
    else if (level === 'debug') console.debug(line);
    else console.log(line);
  }

  #enqueue(job: () => Promise<void>) {
    this.#writeQueue = this.#writeQueue.then(job).catch((err) => { 
      console.error('Error writing log to file', err);
     });
    return this.#writeQueue;
  }

  async closeExecution(executionId: string) {
    const safeSource = this.source.replace(/[^a-zA-Z0-9]/g, '_');
    const logDir = path.resolve('./logs', safeSource);
    const d = new Date();
    const safeDate = `${String(d.getDate()).padStart(2,'0')}-${String(d.getMonth()+1).padStart(2,'0')}-${d.getFullYear()}`;
    const execDir = path.join(logDir, safeDate);
    const filePath = path.join(execDir, `${executionId}.json`);
    await this.#enqueue(async () => {
      // If nothing was written (no opening '['), initialize an empty array
      try {
        await fs.appendFile(filePath, '', 'utf-8');
      } catch (_) {
        await fs.mkdir(execDir, { recursive: true });
        await fs.writeFile(filePath, '[\n', 'utf-8');
      }
      await fs.appendFile(filePath, '\n]', 'utf-8');
      this.#openedExecutions.delete(executionId);
      this.#needsComma.delete(executionId);
    });
  }
}
