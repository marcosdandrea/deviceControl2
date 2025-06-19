import { Trigger } from "../index.js";

export const TriggerTypes = {
    cron: "cron",
    tcp: "tcp",
    udp: "udp",
    onStart: "onStart",
    onRoutineEvent: "onRoutineEvent",
} as const;

export const createNewTriggerByType = async (type: string, params: any): Promise<Trigger> => {
    switch (type) {
        case TriggerTypes.cron:
            const { CronTrigger } = await import("./cron/index.js");
            return new CronTrigger(params);
        case TriggerTypes.tcp:
            const { TcpTrigger } = await import("./tcp/index.js");
            return new TcpTrigger(params);
        case TriggerTypes.udp:
            const { UdpTrigger } = await import("./udp/index.js");
            return new UdpTrigger(params);
        case TriggerTypes.onStart:
            const { OnStartTrigger } = await import("./onStart/index.js");
            return new OnStartTrigger(params);
        case TriggerTypes.onRoutineEvent:
            const { OnRoutineEventTrigger } = await import("./onRoutineEvent/index.js");
            return new OnRoutineEventTrigger(params);
        default:
            throw new Error(`Unknown trigger type: ${type}`);
    }
}