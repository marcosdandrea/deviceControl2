import App from "@src/domain/entities/app/index.js";
import eventManager from "@src/services/eventManager/index.js";
import { getMainWindow } from "./index.js"
import { Log } from "@utils/log.js";

const log = Log.createInstance("mainWindowTitleManager", false)

export const setMainWindowTitle = (title: string | null) => {
    const mainWindow = getMainWindow()
    if (!mainWindow) return

    if (!title || title.length === 0) {
        log.warn("Title is empty, setting default title")
        title = "Device Control 2"
    } else {
        title = `Device Control 2 - ${title}`
    }
    mainWindow.setTitle(title)
    log.info(`Main window title setted to "${title}"`)
}

const handleOnUpdateTitle = () => {
    const app = App.getInstance()
    if (!app) return
    //do some stuff to get the title and set it next 
    setMainWindowTitle(`New App title`)
}

const bindEvents = (events: string[]) => {
    const mainWindow = getMainWindow()
    if (!mainWindow) return
    events.forEach((event) =>
        eventManager.on(event, handleOnUpdateTitle.bind(this)))
}

bindEvents([
    //events that trigger a title update
])

handleOnUpdateTitle()