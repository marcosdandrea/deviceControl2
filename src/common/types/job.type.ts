import { description, id, name } from "./commons.type";

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
    execute: ({ abortSignal, payload }: { abortSignal: AbortSignal, payload?: object }) => Promise<void>;
    toJson: () => JobType;
}