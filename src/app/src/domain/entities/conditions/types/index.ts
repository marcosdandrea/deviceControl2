
export default {
    dayTime: await import("./dayTime/index.js"),
    ping: await import("./ping/index.js"),
    tcpAnswer: await import("./tcpAnswer/index.js"),
    udpAnswer: await import("./udpAnswer/index.js"),
}

export const conditionTypes = {
    dayTime: "dayTime",
    ping: "ping",
    tcpAnswer: "tcpAnswer",
    udpAnswer: "udpAnswer",
} as const;

export const createNewConditionByType = async (type: string, params: any) => {
    switch (type) {
        case conditionTypes.dayTime:
            const { ConditionDayTime } = await import("./dayTime/index.js");
            return new ConditionDayTime(params);
        case conditionTypes.ping:
            const { ConditionPing } = await import("./ping/index.js");
            return new ConditionPing(params);
        case conditionTypes.tcpAnswer:
            const { ConditionTCPAnswer } = await import("./tcpAnswer/index.js");
            return new ConditionTCPAnswer(params);
        case conditionTypes.udpAnswer:
            const { ConditionUDPAnswer } = await import("./udpAnswer/index.js");
            return new ConditionUDPAnswer(params);
        default:
            throw new Error(`Unknown condition type: ${type}`);
    }
}