
export const conditionTypes = {
    dayTime: "dayTime",
    ping: "ping",
    tcpAnswer: "tcpAnswer",
    udpAnswer: "udpAnswer",
} as const;

export const getConditionTypes = async () : Promise<Record<string, any>> => {
    const conditions = {
        dayTime: await import("./dayTime/index.js"),
        ping: await import("./ping/index.js"),
        tcpAnswer: await import("./tcpAnswer/index.js"),
        udpAnswer: await import("./udpAnswer/index.js"),
    }
    return conditions
}

export const createNewConditionByType = async (type: string, params: any) => {
    const conditionTypes = await getConditionTypes();
    const conditionModule = conditionTypes[type];

    if (!conditionModule) {
        throw new Error(`Unknown condition type: ${type}`);
    }
    return new conditionModule.default(params);
}
