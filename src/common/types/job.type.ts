import { Context } from "@src/domain/entities/context";
import { description, id, name } from "./commons.type";

export type JobType = {
    id?: id;
    name: name;
    description?: description;
    params?: Record<string, any>;
    timeout?: number; // in milliseconds
    enableTimoutWatcher?: boolean;
    type?: string; // Default type, can be overridden in subclasses
}

export type requiredJobParamType = {
    name: string;
    type: "string" | "number" | "boolean" | "object" | "array";
    validationMask?: string; // Regex pattern as string
    description: string;
    required: boolean;
}

export interface JobInterface extends JobType {
    execute: ({ abortSignal, ctx }: { abortSignal: AbortSignal, ctx: Context }) => Promise<void>;
    toJson: () => JobType;
}