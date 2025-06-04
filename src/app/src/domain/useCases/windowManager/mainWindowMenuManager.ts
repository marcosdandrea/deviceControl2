import eventManager from "@entities/eventManager/index.js";
import { getMainWindow } from "./index.js"
import { Log } from "@utils/log.js";
import { mainWindowMenu } from "./mainWindowMenu.js";
import { Menu } from "electron";

const log = new Log("mainWindowTitleManager", true)

const refreshMainWindowMenu = () => {
    const menu = Menu.buildFromTemplate(mainWindowMenu());
    Menu.setApplicationMenu(menu);
    log.info("Main window menu refreshed")
}

const bindEvents = (events: string[]) => {
    const mainWindow = getMainWindow()
    if (!mainWindow) return
    events.forEach((event) =>
        eventManager.on(event, refreshMainWindowMenu.bind(this)))
}

bindEvents([
    //events that trigger a menu update
])

refreshMainWindowMenu()