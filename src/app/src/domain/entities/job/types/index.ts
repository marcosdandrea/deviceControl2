

export const jobTypes = {
    waitJob: "waitJob",
    sendUDPJob: "sendUDPJob",
    sendTCPJob: "sendTCPJob",
    wakeOnLanJob: "wakeOnLanJob",
    sendSerialJob: "sendSerialJob",
    sendArtnetJob: "sendArtnetJob",
    controlRoutineJob: "controlRoutineJob",
}

export const getJobTypes = async () : Promise<Record<string, any>> => {
    const jobs = {
        waitJob: await import("./wait/index.js"),
        sendUDPJob: await import("./sendUDP/index.js"),
        sendTCPJob: await import("./sendTCP/index.js"),
        sendSerialJob: await import("./sendSerial/index.js"),
        sendArtnetJob: await import("./sendArtnet/index.js"),
        wakeOnLanJob: await import("./wakeOnLan/index.js"),
        controlRoutineJob: await import("./controlRoutine/index.js"),
    }
    return jobs
}

export const createNewJobByType = async (type: string, params: any) => {
    const jobTypes = await getJobTypes();
    const jobModule = jobTypes[type];
    if (!jobModule) {
        throw new Error(`Unknown job type: ${type}`);
    }
    console.log (jobModule)
    return new jobModule.default(params);
}
