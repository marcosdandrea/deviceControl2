import eventManager from "@src/services/eventManager/index.js";
import { getMainWindow } from "./index.js"
import { Log } from "@utils/log.js";
import { mainWindowMenu } from "./mainWindowMenu.js";
import { Menu } from "electron";
import projectEvents from "@common/events/project.events.js";
import { Project } from "@src/domain/entities/project/index.js";

const log = new Log("mainWindowTitleManager", true)

const refreshMainWindowMenu = () => {

    const project = Project.getInstance()

    const menu = Menu.buildFromTemplate(mainWindowMenu({
        saveEnabled: project?.hasUnsavedChanges() ? project.name ? true : false : false,
        saveAsEnabled: project?.id ? true : false, 
        closeProjectEnabled: project?.id ? true : false
    }));
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
    projectEvents.created,
    projectEvents.opened,
    projectEvents.closed,
])

refreshMainWindowMenu()