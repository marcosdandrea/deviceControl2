import { Trigger } from "../index.js";

export const getTriggerTypes = async (): Promise<Record<string, any>> => {

    const triggers = {
        api: await import("./api/index.js"),
        cron: await import("./cron/index.js"),
        tcp: await import("./tcp/index.js"),
        udp: await import("./udp/index.js"),
        onStart: await import("./onStart/index.js"),
        onRoutineEvent: await import("./onRoutineEvent/index.js"),
    }
    return triggers;
}


export const createNewTriggerByType = async (type: string, params: any): Promise<Trigger> => {
    const triggerTypes = await getTriggerTypes();
    const triggerModule = triggerTypes[type];

    if (!triggerModule) 
        throw new Error(`Trigger module "${type}" not found`);

    return new triggerModule.default(params);
}
