import { description, id, name, RunCtx } from "./commons.type";

export type JobType = {
    id?: id;
    name: name;
    description?: description;
    timeout?: number;
    params?: Record<string, any>;
    enableTimoutWatcher?: boolean;
    type?: string; // Default type, can be overridden in subclasses
}

export interface JobInterface extends JobType {
    execute: ({ abortSignal, payload, runCtx }: { abortSignal: AbortSignal, payload?: object, runCtx: RunCtx }) => Promise<void>;
    toJson: () => JobType;
}