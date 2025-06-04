import App from "@src/domain/entities/app/index.js";
import eventManager from "@entities/eventManager/index.js";
import { getMainWindow } from "./index.js"
import { Log } from "@utils/log.js";

const log = new Log("mainWindowTitleManager", true)

const setMainWindowTitle = (title: string) => {
    const mainWindow = getMainWindow()
    if (!mainWindow) return
    mainWindow.setTitle(title)
    log.info(`Main window title setted to "${title}"`)
}

const handleOnUpdateTitleAndMenu = () => {
    const app = App.getInstance()
    if (!app) return
    //do some stuff to get the title and set it next 
    setMainWindowTitle(`New App title`)
}

const bindEvents = (events: string[]) => {
    const mainWindow = getMainWindow()
    if (!mainWindow) return
    events.forEach((event) =>
        eventManager.on(event, handleOnUpdateTitleAndMenu.bind(this)))
}

bindEvents([
    //events that trigger a title update
])

handleOnUpdateTitleAndMenu()