import { Log } from "@src/utils/log.js";
import { Server } from "../server";
const log = new Log("EventBridge", true)

let io = null;

(async () => {
    const serverInstance = await Server.getInstance();

    if (!serverInstance) {
        log.error("Server instance not found. Cannot send event to clients.");
        return;
    }

    io = serverInstance.getIO();

    if (!io) {
        log.error("Socket.IO instance not found. Cannot send event to clients.");
        return;
    }
})();


export const sendToClients = async (eventName: string, payload: any) => {

    if (!io) {
        log.error("Socket.IO instance not initialized. Cannot send event to clients.");
        return;
    }

    io.emit(eventName, payload);
    log.info(`Event "${eventName}" sent to clients with payload:`, payload);
}

