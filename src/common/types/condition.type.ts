import { Context } from "@src/domain/entities/context";
import { description, id, name } from "./commons.type";

export type ConditionType = {
    id: id;
    name: name;
    description?: description;
    timeoutValue: number;
    type: string;
    params: Record<string, any>;
}

export type requiredConditionParamType = {
    name: string;
    type: "string" | "number" | "boolean" | "object";
    validationMask?: string;
    description: string;
    required: boolean;
}

export interface ConditionInterface extends ConditionType {
    evaluate: ({ abortSignal, ctx }: { abortSignal: AbortSignal, ctx: Context }) => Promise<boolean>;
    setTimeoutValue: (timeout: number) => void;
    toJson: () => ConditionType;
}