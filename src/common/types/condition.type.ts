import { description, id, name, RunCtx } from "./commons.type";

export type ConditionType = {
    id: id;
    name: name;
    description?: description;
    timeoutValue: number;
    type: string;
    params: Record<string, any>;
}

export interface ConditionInterface extends ConditionType {
    evaluate: ({ abortSignal, runCtx }: { abortSignal: AbortSignal, runCtx: RunCtx }) => Promise<boolean>;
    setTimeoutValue: (timeout: number) => void;
    toJson: () => ConditionType;
}