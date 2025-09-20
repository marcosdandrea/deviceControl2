import 'dotenv/config'
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

const coreProcesses = async () => {

  //server for panel and administration
  const mainServer = await ServerManager.createInstance({
    name: "main",
    port: 80,
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
}

(async () => {

  if (isHeadless) {
    await coreProcesses();
  } else {

    const { app } = await import('electron');
    electronApp = app;
    app.whenReady().then(async () => {
      await coreProcesses();
      const { createMainWindow } = await import('@src/domain/useCases/windowManager/index.js')
      await createMainWindow()

      log.info('App is ready');
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

})()
