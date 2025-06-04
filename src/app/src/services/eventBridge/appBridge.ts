import { Log } from "@src/utils/log.js";
const log = new Log("AppBridge", true)

export const registerAppBridge = () => {

    /*
    eventManager.on("AppEventName", () => {
        log.info("Event received from event manager")
        
        do some stuff

        sends to renderer the event and payload
        sendToRenderer("AppEventName", payload)
    })
    */

    log.info("App bridge registered successfully")
}
