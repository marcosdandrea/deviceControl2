import { description, id, name } from "./commons.type";

export type ConditionType = {
    id: id;
    name: name;
    description: description;
    timeout: number | false;
}

export interface ConditionInterface extends ConditionType {
    evaluate: ({ abortSignal }: { abortSignal: AbortSignal }) => Promise<boolean>;
    toJson: () => ConditionType;
}