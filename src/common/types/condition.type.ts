import { description, id, name } from "./commons.type";

export type ConditionType = {
    id: id;
    name: name;
    description: description;
    timeoutValue: number;
    type: string;
}

export interface ConditionInterface extends ConditionType {
    evaluate: ({ abortSignal }: { abortSignal: AbortSignal }) => Promise<boolean>;
    setTimeoutValue: (timeout: number) => void;
    toJson: () => ConditionType;
}