import { WindowManager } from "@src/services/windowManager/index.js"
import { getVersion } from "@src/utils/getVersion";
import { isDev } from "@src/utils/index.js"
import { Log } from "@src/utils/log.js";

const log = Log.createInstance("windowManagerUseCase", false)

let mainWindow: import('electron').BrowserWindow | null = null

const mainFullscreen =
    process.argv.includes('--main-fullscreen') ||
    process.argv.includes('--fullscreen') ||
    process.argv.includes('--f') ||
    process.env.FULLSCREEN === 'true';

/**
 * Resolve the target Electron Display object from CLI/env args.
 *
 * Priority:
 *   1. --display-id=<id>   (exact Electron display id)
 *   2. --screen=<N>        (1-based index)
 *   3. DISPLAY_ID env var
 *   4. SCREEN env var
 *   5. Fallback: index 0
 */
const getTargetDisplay = (
    screen: import('electron').Screen,
    displays: import('electron').Display[]
): import('electron').Display => {
    const primaryDisplay = screen.getPrimaryDisplay();

    // 1. --display-id=<id>
    const displayIdArg = process.argv.find(a => /^--display-id=\d+$/.test(a));
    if (displayIdArg) {
        const id = parseInt(displayIdArg.replace('--display-id=', ''), 10);
        const found = displays.find(d => d.id === id);
        if (found) return found;
        log.warn(`--display-id=${id} not found among connected displays. Falling back to primary display (id=${primaryDisplay.id}).`);
        return primaryDisplay;
    }

    // 2. DISPLAY_ID env var
    if (process.env.DISPLAY_ID) {
        const id = parseInt(process.env.DISPLAY_ID, 10);
        const found = displays.find(d => d.id === id);
        if (found) return found;
        log.warn(`DISPLAY_ID=${id} not found among connected displays. Falling back to primary display (id=${primaryDisplay.id}).`);
        return primaryDisplay;
    }

    // 3. --screen=N (1-based index)
    const screenArg = process.argv.find(a => /^--screen=\d+$/.test(a)) || process.env.SCREEN;
    if (screenArg) {
        const n = parseInt(screenArg.replace(/^--screen=/, ''), 10);
        if (!isNaN(n) && n >= 1 && displays[n - 1]) return displays[n - 1];
    }

    // 4. Fallback: primary display
    return primaryDisplay;
}

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

    // Mover ventana al display solicitado
    const { screen } = await import('electron');
    const displays = screen.getAllDisplays();
    const targetDisplay = getTargetDisplay(screen, displays);
    log.info(`Target display: id=${targetDisplay.id}, bounds=${JSON.stringify(targetDisplay.bounds)}`);
    win.setBounds(targetDisplay.bounds);

    if (isDev()) {
        win.loadURL('http://localhost:5123/#/control');
        win.webContents.openDevTools({ mode: "detach" })
        if (mainFullscreen) {
            win.maximize()
            win.setFullScreen(true)
        }
    } else {
        win.loadURL(`http://${addresses[0]}:${mainServer.port}/#/control`);
        if (mainFullscreen) {
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