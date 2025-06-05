export default {
    sendUDPJob: await import("./sendUDP/index.js"),
    sendSerialJob: await import("./sendSerial/index.js"),
    sendArtnetJob: await import("./sendArtnet/index.js"),
    waitJob: await import("./wait/index.js"),
}

export const jobTypes = {
    sendUDPJob: "sendUDPJob",
    sendSerialJob: "sendSerialJob",
    sendTCPJob: "sendTCPJob",
    sendArtnetJob: "sendArtnetJob",
    waitJob: "waitJob",
}