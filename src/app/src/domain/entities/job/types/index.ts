export default {
    sendUDPJob: await import("./sendUDP/index.js"),
    waitJob: await import("./wait/index.js"),
} 

export const jobTypes = {
    sendUDPJob: "sendUDPJob",
    sendTCPJob: "sendTCPJob",
    waitJob: "waitJob",
}