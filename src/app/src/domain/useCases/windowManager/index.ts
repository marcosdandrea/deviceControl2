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
        win.loadURL('http://localhost:5123/control');
        win.webContents.openDevTools({ mode: "detach" })
    } else {
        win.loadURL(`http://${addresses[0]}/control`);
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

    win.on("close", async (event) => {
        event.preventDefault()
        const appUseCases = await import('@src/domain/useCases/app/index.js');
        win.destroy()
        appUseCases.closeApp()
    })
}