import { WindowManager } from "@domain/entities/windowManager/index.js"
import { getUIPath } from "@utils/pathResolver.js"
import { isDev } from "@utils/index.js"
import path from "path";
import { setWebContents } from "@src/services/ipcServices/index.js";
import { Log } from "@utils/log.js";

const log = new Log("windowManagerUseCase", true)

let mainWindow: import('electron').BrowserWindow | null = null

export const getWebContents = () => mainWindow?.webContents || null;

export const getMainWindow = () => mainWindow;

const setMainWindow = (window: import('electron').BrowserWindow) => {
    mainWindow = window
}

export const createMainWindow = async () => {
    log.info("Creating main window")

    if (mainWindow) {
        log.info("Main window already exists")
        mainWindow.show()
        return mainWindow
    }
    
    const WM = WindowManager.getInstance()
    const win = await WM.createWindow({
        name: "main",
        webPreferences: {
            preload: path.join(__dirname, "preload.js"),
            contextIsolation: true,
            nodeIntegration: false,
        }
    })

    setWebContents(win.webContents)
    
    if (isDev()) {
        win.loadURL('http://localhost:5123');
        win.webContents.openDevTools({ mode: "detach" })
    } else {
        win.loadURL(getUIPath());
    }

    setMainWindow(win)
    const appTitle: string = process.env.APP_TITLE || ""
    win.setTitle(appTitle)

    import ("./mainWindowMenuManager.js")
    import ("./mainWindowTitleManager.js")
    log.info("Main window created")


    win.on("close", async (event) => {
        event.preventDefault()
        const appUseCases = await import('@useCases/app/index.js');
        win.destroy()
        appUseCases.closeApp()
    })
}