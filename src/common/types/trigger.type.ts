import { description, id, name } from "./commons.type";
import { EventEmitter } from "events";

export type TriggerType = {
    id: id;
    name: name;
    easyName?: string;
    description?: description;
    armed?: boolean;
    type?: string;
    reArmOnTrigger?: boolean;
    disableRearming?: boolean;
    allowAutoRearming?: boolean;
    triggered?: boolean;
    params?: any; // Agregar esta línea
}

export type requiredTriggerParamType = {
    easyName: string;
    type: string;
    description: string;
    validationMask: string;
    required: boolean;
    options?: "routinesID" |string[];
    testAction?: string; // Acción del sistema para probar la validez del parámetro
    defaultValue?: any;
    warning?: string; // Mensaje de advertencia para mostrar en la UI
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