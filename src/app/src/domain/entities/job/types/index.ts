
export const loadJobModules = async () => {
    const [
        waitJob,
        sendUDPJob,
        sendTCPJob,
        sendSerialJob,
        sendArtnetJob,
        controlRoutineJob
    ] = await Promise.all([
        import("./wait/index.js"),
        import("./sendUDP/index.js"),
        import("./sendTCP/index.js"),
        import("./sendSerial/index.js"),
        import("./sendArtnet/index.js"),
        import("./controlRoutine/index.js"),
    ]);

    return {
        waitJob,
        sendUDPJob,
        sendTCPJob,
        sendSerialJob,
        sendArtnetJob,
        controlRoutineJob
    };
};

export const jobTypes = {
    waitJob: "waitJob",
    sendUDPJob: "sendUDPJob",
    sendTCPJob: "sendTCPJob",
    sendSerialJob: "sendSerialJob",
    sendArtnetJob: "sendArtnetJob",
    controlRoutineJob: "controlRoutineJob",
}

export const createNewJobByType = async (type: string, params: any) => {
    switch (type) {
        case jobTypes.waitJob:
            const { WaitJob } = await import("./wait/index.js");
            return new WaitJob(params);
        case jobTypes.sendUDPJob:
            const { SendUDPJob } = await import("./sendUDP/index.js");
            return new SendUDPJob(params);
        case jobTypes.sendTCPJob:
            const { SendTCPJob } = await import("./sendTCP/index.js");
            return new SendTCPJob(params);
        case jobTypes.sendSerialJob:
            const { SendSerialJob } = await import("./sendSerial/index.js");
            return new SendSerialJob(params);
        case jobTypes.sendArtnetJob:
            const { SendArtnetJob } = await import("./sendArtnet/index.js");
            return new SendArtnetJob(params);
        case jobTypes.controlRoutineJob:
            const { ControlRoutineJob } = await import("./controlRoutine/index.js");
            return new ControlRoutineJob(params);
        default:
            throw new Error(`Unknown job type: ${type}`);
    }
}
