import { description, id, name } from "./commons.type";
import { EventEmitter } from "events";

export type TriggerType = {
    id?: id;
    name: name;
    description?: description;
    triggered?: boolean;
    armed?: boolean;
    type?: string;
    reArmOnTrigger: boolean;
}

export interface TriggerInterface extends TriggerType, EventEmitter {
    arm: () => void;
    disarm: () => void;
    trigger: (...args: any[]) => void;
    toJson: () => TriggerType;
}