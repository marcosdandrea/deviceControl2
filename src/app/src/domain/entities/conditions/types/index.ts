
export const loadConditionModules = async () => {
    const [dayTime, ping, tcpAnswer, udpAnswer] = await Promise.all([
        import("./dayTime/index.js"),
        import("./ping/index.js"),
        import("./tcpAnswer/index.js"),
        import("./udpAnswer/index.js"),
    ]);

    return {
        dayTime,
        ping,
        tcpAnswer,
        udpAnswer,
    };
};

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