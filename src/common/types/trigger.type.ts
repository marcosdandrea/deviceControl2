import { description, id, name } from "./commons.type";
import { EventEmitter } from "events";

export type TriggerType = {
    id?: id;
    name: name;
    description?: description;
    armed?: boolean;
    type?: string;
    reArmOnTrigger?: boolean;
    triggered?: boolean;
}

export interface TriggerInterface extends TriggerType, EventEmitter {
    arm: () => void;
    disarm: () => void;
    toJson: () => TriggerType;
}