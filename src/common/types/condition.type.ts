import { Context } from "@src/domain/entities/context";
import { description, id, name } from "./commons.type";

export type ConditionType = {
    id: id;
    name: name;
    description?: description;
    type: string;
    params: Record<string, any>;
}

export type requiredConditionParamType = {
    name: string;
    type: "string" | "number" | "boolean" | "object" | "select";
    validationMask?: string;
    description: string;
    required: boolean;
    options?: { label: string; value: string }[];
}

export interface ConditionInterface extends ConditionType {
    evaluate: ({ abortSignal, ctx }: { abortSignal: AbortSignal, ctx: Context }) => Promise<boolean>;
    toJson: () => ConditionType;
}