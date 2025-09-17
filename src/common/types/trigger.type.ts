import { description, id, name } from "./commons.type";
import { EventEmitter } from "events";

export type TriggerType = {
    id: id;
    name: name;
    description?: description;
    armed?: boolean;
    type?: string;
    reArmOnTrigger?: boolean;
    disableRearming?: boolean;
    triggered?: boolean;
    params?: any; // Agregar esta línea
}

export type requiredTriggerParamType = {
    name: string;
    easyName: string;
    type: string;
    description: string;
    validationMask: string;
    required: boolean;
}

export interface TriggerInterface extends TriggerType, EventEmitter {
    arm: () => void;
    disarm: () => void;
    toJson: () => TriggerType;
}

export const TriggerTypes = {
    api: "api",
    endpoint: "endpoint",
    cron: "cron",
    tcp: "tcp",
    udp: "udp",
    onStart: "onStart",
    onRoutineEvent: "onRoutineEvent",
} as const;