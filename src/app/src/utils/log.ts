// log.ts
import fs from 'fs/promises';
import path from 'path';

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

export class Log {
  source: string;
  verbose: boolean;
  isRootComponent: boolean;
  rootComponent: Log | null;

  // Cola interna para serializar escrituras y evitar pisadas
  #writeQueue: Promise<void> = Promise.resolve();

  constructor(source: string, verbose: boolean = false, isRootComponent?: boolean) {
    this.source = source;
    this.verbose = verbose;
    this.isRootComponent = isRootComponent || false;
    this.rootComponent = null;

    if (this.isRootComponent) {
      // No es necesario "abrir" nada para NDJSON, pero aseguramos carpeta/archivo.
      this.#initializeLogFile().catch(err => {
        // Evitamos recursión: no llamamos this.error aquí
        console.error(`[${this.source}] Failed to init log file:`, err);
      });
    }
  }

  /**
   * Lee todas las líneas NDJSON y devuelve un array de objetos de log.
   */
  async getLog(): Promise<any[]> {
    const filePath = this.#getLogFilePath();
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const lines = content.split('\n').filter(l => l.trim().length > 0);
      const parsed = [];
      for (const line of lines) {
        try {
          parsed.push(JSON.parse(line));
        } catch {
          // Si hubiera una línea cortada o corrupta, la ignoramos.
        }
      }
      return parsed;
    } catch (err: any) {
      if (err?.code === 'ENOENT') return []; // si no existe, devolvemos vacío
      throw err;
    }
  }

  async #initializeLogFile(): Promise<void> {
    await fs.mkdir(this.#getLogDir(), { recursive: true });
    // "Touch" del archivo para asegurar que existe
    const filePath = this.#getLogFilePath();
    try {
      await fs.access(filePath);
    } catch {
      await fs.writeFile(filePath, ''); // NDJSON: archivo vacío está OK
      // Logueamos que se creó (como es root, escribimos directo)
      await this.#writeToLog(this.source, 'info', `Log file created at ${filePath}`, []);
    }
  }

  #getLogDir(): string {
    // Subcarpeta por fecha: ./logs/DD-MM-YYYY
    const now = new Date();
    const dd = String(now.getDate()).padStart(2, '0');
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const yyyy = now.getFullYear();
    return path.join('.', 'logs', `${dd}-${mm}-${yyyy}`);
  }

  #getLogFilePath(): string {
    return path.join(this.#getLogDir(), `${this.source}.log`);
  }

  #enqueueWrite(fn: () => Promise<void>) {
    this.#writeQueue = this.#writeQueue.then(fn).catch(err => {
      // Evitamos recursión: no usamos this.error aquí
      console.error(`[${this.source}] Failed to write to log file:`, err);
    });
  }

  async flush(): Promise<void> {
    // Permite esperar a que terminen las escrituras pendientes (útil en shutdown/tests)
    await this.#writeQueue;
  }

  #writeToLog(source: string, level: LogLevel, message: string, args: any[]): Promise<void> {
    const logEntry = {
      timestamp: new Date().toISOString(),
      source: source || this.source,
      level,
      message,
      args,
    };
    const line = JSON.stringify(logEntry) + '\n';

    // Encolamos el append para serializar escrituras
    return new Promise<void>((resolve, reject) => {
      this.#enqueueWrite(async () => {
        await fs.mkdir(this.#getLogDir(), { recursive: true });
        await fs.appendFile(this.#getLogFilePath(), line, { encoding: 'utf-8' });
        resolve();
      });
    });
  }

  addChildLogEntry({
    source,
    level,
    message,
    args,
  }: {
    source: string;
    level: LogLevel;
    message: string;
    args: any[];
  }): void {
    if (!this.rootComponent) return;
    // No propagamos errores hacia arriba para evitar loops
    void this.rootComponent.#writeToLog(source, level, message, args);
  }

  setRootLog(rootLog: Log): void {
    this.rootComponent = rootLog;
  }

  info(message: string, ...args: any[]): void {
    if (this.verbose) console.log(`[${this.source}] ${message}`, ...args);
    this.addChildLogEntry({ source: this.source, level: 'info', message, args });
  }

  warn(message: string, ...args: any[]): void {
    console.warn(`[${this.source}] ${message}`, ...args);
    this.addChildLogEntry({ source: this.source, level: 'warn', message, args });
  }

  error(message: string, ...args: any[]): void {
    console.error(`[${this.source}] ${message}`, ...args);
    this.addChildLogEntry({ source: this.source, level: 'error', message, args });
  }

  debug(message: string, ...args: any[]): void {
    if (this.verbose) console.debug(`[${this.source}] ${message}`, ...args);
    // Si querés que debug también se persista, descomentá:
    // this.addChildLogEntry({ source: this.source, level: 'debug', message, args });
  }
}
