
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

export interface TreeNode {
  id: string;
  type: string;
  name?: string;
  children: Record<string, TreeNode>;
  logs: logContextEntry[];
}

export interface ExecutionTree {
  rootId: string;
  nodes: Record<string, TreeNode>;  // índice rápido por id
}