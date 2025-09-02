import { Log } from "@src/utils/log";
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
    params?: any; // Agregar esta línea
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