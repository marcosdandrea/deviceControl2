export default {
    sendUDPJob: await import("./sendUDP/index.js"),
    sendArtnetJob: await import("./sendArtnet/index.js"),
    waitJob: await import("./wait/index.js"),
}

export const jobTypes = {
    sendUDPJob: "sendUDPJob",
    sendTCPJob: "sendTCPJob",
    sendArtnetJob: "sendArtnetJob",
    waitJob: "waitJob",
}