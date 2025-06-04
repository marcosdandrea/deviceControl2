import { getWebContents } from "@src/domain/useCases/windowManager/index.js";
import { registerAppBridge } from "./appBridge.js";
import { Log } from "@src/utils/log.js";

const log = new Log("EventBridge", true)

export const sendToRenderer = (eventName: string, payload: any) => {
    const webContents = getWebContents()
    if (!webContents)
        throw new Error("Main window not found")
    webContents.send(eventName, payload)
    log.info(`Event sent to renderer: ${eventName}`, payload)
}

export const registerEventBridge = async () => {
    try {
        log.info("Registering event bridge...")
        registerAppBridge()
        // Register all bridges i.e. project, multitrack, app
        // This is where you can add more bridges
        // bridges are meant to receive events from event manager
        // and send them to the renderer process
        // should be separated by domain
        log.info("Event bridge registered successfully")
    } catch (error) {
        console.error("Error registering event bridge:", error);
    }
}