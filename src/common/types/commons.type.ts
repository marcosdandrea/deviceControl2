import { Log } from "@src/utils/log";

export type id = string;
export type name = string;
export type description = string;

export type RunCtx = {
        executionId: string;
        hierarchy?: {type: string, name: string}[];
        baseLogger: Log;
    };