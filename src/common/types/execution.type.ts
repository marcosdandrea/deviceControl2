export interface LogEntry {
  ts: string;
  level: 'info' | 'warn' | 'error';
  message: string;
  data?: any;
}

export interface TriggeredBy {
  id: string;
  type: 'trigger';
  name: string;
  ts: string;
}

export interface LogChild {
  id: string;
  type: 'task' | 'routine';
  name: string;
  ts: string;
  logs: LogEntry[];
  children: LogChild[];
}

export interface ExecutionLog {
  id: string;
  type: 'routine' | 'task';
  name: string;
  ts: string;
  logs: LogEntry[];
  children: LogChild[];
}

export interface Execution {
  executionId: string;
  triggeredBy: TriggeredBy;
  log: ExecutionLog;
}