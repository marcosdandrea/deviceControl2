
export default {
    waitJob: await import("./wait/index.js"),
    sendUDPJob: await import("./sendUDP/index.js"),
    sendTCPJob: await import("./sendTCP/index.js"),
    sendSerialJob: await import("./sendSerial/index.js"),
    sendArtnetJob: await import("./sendArtnet/index.js"),
    controlRoutineJob: await import("./controlRoutine/index.js"),
}

export const jobTypes = {
    waitJob: "waitJob",
    sendUDPJob: "sendUDPJob",
    sendTCPJob: "sendTCPJob",
    sendSerialJob: "sendSerialJob",
    sendArtnetJob: "sendArtnetJob",
    controlRoutineJob: "controlRoutineJob",
}