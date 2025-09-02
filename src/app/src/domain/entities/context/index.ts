import { nanoid } from "nanoid";

/** Ajustá estos tipos a @common/types si los tenés ya definidos */
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
  children: Record<string, TreeNode>;
  logs: logContextEntry[];
}

interface ExecutionTree {
  rootId: string;
  nodes: Record<string, TreeNode>;  // índice rápido por id
}

class LoggerContext {
  private static instance: LoggerContext;

  /** Un árbol por ejecución */
  private executions = new Map<string, ExecutionTree>();

  private constructor() {}

  static getInstance() {
    if (!LoggerContext.instance) LoggerContext.instance = new LoggerContext();
    return LoggerContext.instance;
  }

  /** Crea el árbol para una ejecución si no existe */
  ensureExecution(executionId: string, rootNode: nodeType) {
    if (this.executions.has(executionId)) return;

    const root: TreeNode = {
      id: rootNode.id,
      type: rootNode.type,
      name: rootNode.name ?? "execution",
      children: {},
      logs: [],
    };

    this.executions.set(executionId, {
      rootId: root.id,
      nodes: { [root.id]: root },
    });
  }

  private getExec(executionId: string): ExecutionTree {
    const exec = this.executions.get(executionId);
    if (!exec) throw new Error(`Execution "${executionId}" not found`);
    return exec;
  }

  /** Garantiza que exista el hijo directo bajo parentId */
  private ensureChildNode(exec: ExecutionTree, parentId: string, child: nodeType): TreeNode {
    const parent = exec.nodes[parentId];
    if (!parent) throw new Error(`Parent "${parentId}" not found`);

    const existing = exec.nodes[child.id];
    if (existing) {
      // Si ya existe, nos aseguramos que figure como hijo del parent
      parent.children[existing.id] = existing;
      return existing;
    }

    const created: TreeNode = {
      id: child.id,
      type: child.type,
      name: child.name,
      children: {},
      logs: [],
    };
    parent.children[created.id] = created;
    exec.nodes[created.id] = created;
    return created;
  }

  /** Garantiza toda la ruta (desde root) y devuelve el nodo hoja */
  private ensurePath(executionId: string, path: nodeType[]): TreeNode {
    const exec = this.getExec(executionId);
    if (!Array.isArray(path) || path.length === 0) {
      throw new Error("path debe ser un array de nodeType no vacío");
    }
    if (path[0].id !== exec.rootId) {
      throw new Error(`El path no arranca en el root de la ejecución (${exec.rootId})`);
    }
    let current = exec.nodes[exec.rootId];
    for (let i = 1; i < path.length; i++) {
      current = this.ensureChildNode(exec, current.id, path[i]);
    }
    return current;
  }

  /** Agrega un log en el nodo apuntado por path */
  addLog(executionId: string, path: nodeType[], entry: Omit<logContextEntry, "ts"> & { ts?: string }) {
    const node = this.ensurePath(executionId, path);
    node.logs.push({
      ts: entry.ts ?? new Date().toISOString(),
      level: entry.level,
      message: entry.message,
      data: entry.data,
    });
  }

  /** Asegura un hijo bajo path y lo devuelve (para child contexts) */
  ensureChild(executionId: string, parentPath: nodeType[], child: nodeType): TreeNode {
    const parent = this.ensurePath(executionId, parentPath);
    const exec = this.getExec(executionId);
    return this.ensureChildNode(exec, parent.id, child);
  }

  /** Exporta el árbol de la ejecución */
  toJSON(executionId?: string) {
    const clone = (n: TreeNode): any => ({
      id: n.id,
      type: n.type,
      name: n.name,
      logs: n.logs.map(l => ({ ...l })),
      children: Object.values(n.children).map(clone),
    });

    if (executionId) {
      const exec = this.getExec(executionId);
      return {
        executionId,
        tree: clone(exec.nodes[exec.rootId]),
      };
    }

    const allExecutions = {} as Record<string, any>;
    this.executions.forEach((exec, execId) => {
      allExecutions[execId] = clone(exec.nodes[exec.rootId]);
    });
    return allExecutions;
  }
}

export class Context {
  id: string;               // executionId
  path: nodeType[];
  logger: LoggerContext;

  private constructor(params: contextType) {
    this.id = params.id;
    this.path = params.path;
    this.logger = params.logger;
  }

  /** Root */
  static createRootContext(node: nodeType) {
    const executionId = nanoid(8);
    const logger = LoggerContext.getInstance();

    logger.ensureExecution(executionId, node);

    const ctx = new Context({
      id: executionId,
      logger,
      path: [node],
    });

    return ctx;
  }

  /** Child (misma ejecución, path extendido) */
  createChildContext(node: nodeType) {
    this.logger.ensureChild(this.id, this.path, node);

    const child = new Context({
      id: this.id,          // *** MISMA ejecución ***
      logger: this.logger,
      path: [...this.path, node],
    });

    return child;
  }

  /** Facade de logging */
  log = {
    info: (message: string, data?: unknown) =>
      this.logger.addLog(this.id, this.path, { level: "info", message, data }),
    warn: (message: string, data?: unknown) =>
      this.logger.addLog(this.id, this.path, { level: "warn", message, data }),
    error: (message: string, data?: unknown) =>
      this.logger.addLog(this.id, this.path, { level: "error", message, data }),
    debug: (message: string, data?: unknown) =>
      this.logger.addLog(this.id, this.path, { level: "debug", message, data }),
  };

  /** Export del árbol completo */
  toJSON(id?: string ) {
    return this.logger.toJSON(id);
  }
}
