import { WindowManager } from "@src/services/windowManager/index.js"
import { getVersion } from "@src/utils/getVersion";
import { isDev } from "@src/utils/index.js"
import { Log } from "@src/utils/log.js";

const log = Log.createInstance("windowManagerUseCase", true)

let mainWindow: import('electron').BrowserWindow | null = null

const fullscreen = process.argv.includes('--fullscreen') || process.argv.includes('--f') || process.env.FULLSCREEN === 'true'

// Configurar handler para abrir URLs externas
const setupIpcHandlers = async () => {
    const { ipcMain, shell } = await import('electron');
    
    ipcMain.on('open-external', (event, url: string) => {
        log.info(`Opening external URL: ${url}`);
        shell.openExternal(url);
    });
};

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

    // Configurar handlers IPC
    await setupIpcHandlers();

    const WM = WindowManager.getInstance()
    const win = await WM.createWindow({
        name: "main",
        show: false,
        webPreferences: {
            preload: await import('path').then(path => path.join(__dirname, "preload.js")),
            contextIsolation: true,
            nodeIntegration: false,
        }
    })

    //setWebContents(win.webContents)
    const serverManager = await import('@src/services/server/serverManager.js');
    const mainServer = serverManager.ServerManager.getInstance("main")
    const addresses = mainServer.getNetworkInterfaces()

    if (isDev()) {
        win.loadURL('http://localhost:5123/#/control');
        win.webContents.openDevTools({ mode: "detach" })
    } else {
        win.loadURL(`http://${addresses[0]}:${mainServer.port}/#/control`);
        if (fullscreen) {
            win.maximize()
            win.setFullScreen(true)
        }
    }

    setMainWindow(win)
    win.setMenu(null)
    const title = `Device Control ${await getVersion()}`;
    log.info(`Setting window title to: "${title}"`);
    win.setTitle(title)
    log.info("Main window created")

    win.once("ready-to-show", () => {
        log.info("Main window ready to show")
        win.show()
        WM.closeWindow("splash")
    })

    win.on("close", async (event) => {
        event.preventDefault()
        const appUseCases = await import('@src/domain/useCases/app/index.js');
        win.destroy()
        appUseCases.closeApp()
    })
}

export const createSplashWindow = async () => {
    log.info("Creating splash window")
    const isPropietaryHardware = await import('@src/services/hardwareManagement/utils.js').then(mod => mod.isPropietaryHardware())

    if (isPropietaryHardware) {
        log.info("Skipping splash window creation on proprietary hardware")
        return
    }

    const WM = WindowManager.getInstance()
    const win = await WM.createWindow({
        name: "splash",
        width: 600,
        height: 400,
        resizable: false,
        frame: false,
        alwaysOnTop: true,
        webPreferences: {
            preload: await import('path').then(path => path.join(__dirname, "preload.js")),
            contextIsolation: true,
            nodeIntegration: false,
        }
    })

    const path = await import('path');
    const splashPath = isDev() 
        ? path.join(process.cwd(), 'resources/splash/index.html')
        : path.join(process.resourcesPath, 'splash/index.html');
    
    log.info(`Loading splash from: ${splashPath}`);
    win.loadFile(splashPath);
    win.setMenu(null)
    log.info("Splash window created")
}