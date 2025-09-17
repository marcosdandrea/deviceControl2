import { nanoid } from "nanoid";

type LogLevel = "info" | "warn" | "error" | "debug";

export interface logContextEntry {
  ts: string;            // ISO
  level: LogLevel;
  message: string;
  data?: unknown;
}

export interface nodeType {
  id: string;
  type: string;          // "routine" | "task" | "condition" | ...
  name?: string;
}

export interface contextType {
  id: string;                  // executionId
  path: nodeType[];            // desde root hasta el cursor actual
  logger: LoggerContext;
}

interface TreeNode {
  id: string;
  type: string;
  name?: string;
  ts: string;
  children: Record<string, TreeNode>;
  logs: logContextEntry[];
}

interface ExecutionTree {
  rootId: string;
  nodes: Record<string, TreeNode>;  // índice rápido por id
}

class LoggerContext {
  private static instance: LoggerContext;
  private executions = new Map<string, ExecutionTree>();

  constructor() { }

  ensureExecution(executionId: string, rootNode: nodeType) {
    if (this.executions.has(executionId)) return;
    const root: TreeNode = {
      id: rootNode.id,
      type: rootNode.type,
      ts: new Date().toISOString(),
      name: rootNode.name ?? "execution",
      children: {},
      logs: [],
    };
    this.executions.set(executionId, { rootId: root.id, nodes: { [root.id]: root } });
  }

  private getExec(executionId: string): ExecutionTree {
    const exec = this.executions.get(executionId);
    if (!exec) throw new Error(`Execution "${executionId}" not found`);
    return exec;
  }

  private ensureChildNode(exec: ExecutionTree, parentId: string, child: nodeType): TreeNode {
    const parent = exec.nodes[parentId];
    if (!parent) throw new Error(`Parent "${parentId}" not found`);
    const existing = exec.nodes[child.id];
    if (existing) {
      parent.children[existing.id] = existing;
      return existing;
    }
    const created: TreeNode = {
      id: child.id,
      type: child.type,
      name: child.name,
      ts: new Date().toISOString(),
      children: {},
      logs: [],
    };
    parent.children[created.id] = created;
    exec.nodes[created.id] = created;
    return created;
  }

  private ensurePath(executionId: string, path: nodeType[]): TreeNode {
    const exec = this.getExec(executionId);
    if (!Array.isArray(path) || path.length === 0)
      throw new Error("path debe ser un array de nodeType no vacío");
    if (path[0].id !== exec.rootId)
      throw new Error(`El path no arranca en el root de la ejecución (${exec.rootId})`);
    let current = exec.nodes[exec.rootId];
    for (let i = 1; i < path.length; i++) {
      current = this.ensureChildNode(exec, current.id, path[i]);
    }
    return current;
  }

  addLog(executionId: string, path: nodeType[], entry: Omit<logContextEntry, "ts"> & { ts?: string }): string {
    const node = this.ensurePath(executionId, path);
    node.logs.push({
      ts: entry.ts ?? new Date().toISOString(),
      level: entry.level,
      message: entry.message,
      data: entry.data,
    });
    return entry.message
  }

  ensureChild(executionId: string, parentPath: nodeType[], child: nodeType): TreeNode {
    const parent = this.ensurePath(executionId, parentPath);
    const exec = this.getExec(executionId);
    return this.ensureChildNode(exec, parent.id, child);
  }

  // -------- NUEVO: exportar solo una rama por nodeId --------
  exportSubtreeByNodeId(executionId: string, nodeId: string) {
    const exec = this.getExec(executionId);
    const start = exec.nodes[nodeId];
    if (!start) throw new Error(`Node "${nodeId}" not found in execution "${executionId}"`);
    const clone = (n: TreeNode): any => ({
      id: n.id,
      type: n.type,
      name: n.name,
      ts: n.ts,
      logs: n.logs.map(l => ({ ...l })),
      children: Object.values(n.children).map(clone),
    });
    return clone(start);
  }
  // -----------------------------------------------------------

  toJSON(executionId?: string) {
    const clone = (n: TreeNode): any => ({
      id: n.id,
      type: n.type,
      name: n.name,
      ts: n.ts,
      logs: n.logs.map(l => ({ ...l })),
      children: Object.values(n.children).map(clone),
    });

    if (executionId) {
      const exec = this.getExec(executionId);
      return { executionId, tree: clone(exec.nodes[exec.rootId]) };
    }

    const all: Record<string, any> = {};
    this.executions.forEach((exec, execId) => {
      all[execId] = clone(exec.nodes[exec.rootId]);
    });
    return all;
  }
}

export class Context {
  id: string;               // executionId
  path: nodeType[];
  logger: LoggerContext;

  // guarda el nodo "propio" de esta instancia (el que la originó)
  private originNodeId: string;
  private onFinishCallback: ((subtree: any) => void) | null;

  private constructor(params: contextType) {
    this.id = params.id;
    this.path = params.path;
    this.logger = params.logger;
    this.originNodeId = this.path[this.path.length - 1].id;
    this.onFinishCallback = null;
  }

  /** Root */
  static createRootContext(node: nodeType) {
    const executionId = nanoid(8);
    const logger = new LoggerContext();
    logger.ensureExecution(executionId, node);
    return new Context({ id: executionId, logger, path: [node] });
  }

  /** Child (misma ejecución, path extendido) */
  createChildContext(node: nodeType) {
    this.logger.ensureChild(this.id, this.path, node);
    // El child tiene su propio originNodeId (node.id)
    return new Context({
      id: this.id,
      logger: this.logger,
      path: [...this.path, node],
    });
  }

  /** Finaliza SOLO esta instancia y entrega SOLO su rama */
  finish() {
    const log = this.logger.exportSubtreeByNodeId(this.id, this.originNodeId);
    const fullTree = this.logger.toJSON();
    this.onFinishCallback?.({ executionId: this.id, log, fullTree });
  }

  /** Registra el callback de ESTA instancia */
  onFinish(callback: (subtree: any) => void) {
    this.onFinishCallback = callback;
  }

  /** Facade de logging */
  log = {
    info: (message: string, data?: unknown): string =>
      this.logger.addLog(this.id, this.path, { level: "info", message, data }),
    warn: (message: string, data?: unknown): string =>
      this.logger.addLog(this.id, this.path, { level: "warn", message, data }),
    error: (message: string, data?: unknown): string =>
      this.logger.addLog(this.id, this.path, { level: "error", message, data }),
    debug: (message: string, data?: unknown): string =>
      this.logger.addLog(this.id, this.path, { level: "debug", message, data }),
  };

  /** Export del árbol completo (por compatibilidad) */
  toJSON(id?: string) {
    return this.logger.toJSON(id);
  }
}
