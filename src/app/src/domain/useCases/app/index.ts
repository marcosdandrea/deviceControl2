import App from "@domain/entities/app/index.js"
import {Log} from "@utils/log.js"
const log = new Log("useCases", true)

export const createApp = async () => {
    try {
        App.getInstance()
        log.info("App created successfully")
    } catch (error) {
        log.error("Error creating App instance:", error);
    }
}

export const closeApp = () => {
    try {
        log.info("App closed successfully")
    } catch (error) {
        log.error("Error closing App instance:", error);
    }
}

export default {
    createApp,
    closeApp,
}