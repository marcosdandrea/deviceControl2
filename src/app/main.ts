import 'dotenv/config'
import "@src/utils/loadEnv";
import { Log } from '@src/utils/log';
import ipcServices, { broadcastToClients } from '@src/services/ipcServices/index.js';
import { ServerManager } from '@src/services/server/serverManager';
import logEvents from '@common/events/log.events';
import { loadLastProject } from '@src/domain/useCases/project';
import path from "path";

const enableHeapSnapshoot = false
const isHeadless = process.argv.includes('--headless') || process.argv.includes('--h') || process.env.HEADLESS === 'true'
const isDevelopment = process.env.NODE_ENV === 'development' || process.argv.includes('--dev');

const log = Log.createInstance('main', true);

if (isDevelopment) log.info('Running in development mode');
else log.info('Running in production mode');

if (isHeadless) log.info('Headless mode');
else log.info('GUI mode');

if (enableHeapSnapshoot)
  setInterval(async () => {
    const { writeHeapSnapshot } = await import("v8")
    const file = writeHeapSnapshot(); // devuelve el nombre .heapsnapshot
    console.log('Snapshot guardado en:', file);
  }, 15000)

let electronApp: Electron.App | null = null;

const handleFatalError = async (error: Error) => {
  log.error('Device Control has encounter an error and it will exit:', error.message);
  if (!isHeadless) {
    try {
      const { dialog } = await import('electron');
      dialog.showErrorBox('Fatal Error', `Device Control has encounter an error and it will exit:\n\n${error.message}`);
      electronApp?.quit();
    } catch (dialogError) {
      // Si no se puede mostrar el diálogo, salir directamente
      console.error('Could not show error dialog:', dialogError);
      process.exit(1);
    }
  } else {
    console.error('Device Control has encounter an error and it will exit');
    console.error(error);
    process.exit(1);
  }
};

// Manejar excepciones no capturadas globalmente
process.on('uncaughtException', async (error) => {
  log.error('Uncaught Exception:', error);
  await handleFatalError(error);
});

process.on('unhandledRejection', async (reason, promise) => {
  log.error(`Unhandled Rejection at: ${promise} reason: ${reason}`);
  if (reason instanceof Error) {
    await handleFatalError(reason);
  } else {
    await handleFatalError(new Error(String(reason)));
  }
});


const coreProcesses = async () => {
  try {
    //server for panel and administration
    const mainServer = await ServerManager.createInstance({
      name: "main",
      port: process.env.MAIN_SERVER_DEFAULT_PORT ? parseInt(process.env.MAIN_SERVER_DEFAULT_PORT) : 8080,
      useSocketIO: true,
    })

    ipcServices.init(mainServer.getIO());

    Log.eventEmitter.on(logEvents.logInfo, (data) => broadcastToClients(logEvents.logInfo, data));
    Log.eventEmitter.on(logEvents.logWarning, (data) => broadcastToClients(logEvents.logWarning, data));
    Log.eventEmitter.on(logEvents.logError, (data) => broadcastToClients(logEvents.logError, data));
    Log.eventEmitter.on(logEvents.logDebug, (data) => broadcastToClients(logEvents.logDebug, data));

    let staticFilesPath: string;
    if (isDevelopment) {
      staticFilesPath = path.join(process.cwd(), "dist-react");
    } else if (isHeadless) {
      staticFilesPath = path.join(__dirname, "dist-react");
    } else {
      staticFilesPath = path.join(__dirname, "..", "dist-react");
    }

    if (!isDevelopment)
      mainServer.setStaticFiles(staticFilesPath);

    log.info(`Main server started on port ${mainServer.port} with Socket.IO enabled`);

    //server for general purpouses
    const generalServer = await ServerManager.createInstance({
      name: "general",
      port: 4546
    })

    log.info(`General purpose server started on port ${generalServer.port}.`);

    const { createApp } = await import('@src/domain/useCases/app/index.js');
    await createApp()
    try {
      await loadLastProject();
    } catch (error) {
      log.error('Cannot load last project:', error);
    }
  } catch (error) {
    // Re-lanzar el error para que sea manejado por el nivel superior
    throw error;
  }
}

(async () => {

  try {

    if (isHeadless) {
      await coreProcesses();
    } else {

      const { app } = await import('electron');
      electronApp = app;
      app.whenReady().then(async () => {
        try {
          const { createSplashWindow } = await import('@src/domain/useCases/windowManager/index.js')
          await createSplashWindow();

          await coreProcesses();
          
          const { createMainWindow } = await import('@src/domain/useCases/windowManager/index.js')
          await createMainWindow()

          log.info('App is ready');
        } catch (error) {
          await handleFatalError(error as Error);
        }
      });

      app.on('window-all-closed', async () => {
        if (process.platform !== 'darwin') {
          log.info('All windows closed, quitting app');
          electronApp?.quit();
        }
      });

      app.on('activate', async () => {
        const { createMainWindow } = await import('@src/domain/useCases/windowManager/index.js')
        await createMainWindow()
      });

      app.on('before-quit', () => {
        log.info('App is quitting');
      });

    }
  } catch (error) {
    await handleFatalError(error as Error);
  }

})()