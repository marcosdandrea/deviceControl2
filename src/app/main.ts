import 'dotenv/config'
import { Log } from '@utils/log.js';
import ipcServices from '@src/services/ipcServices/index.js';
import { ServerManager } from '@src/services/server/serverManager';

const enableHeapSnapshoot = false
const isHeadless = process.argv.includes('--headless') || process.argv.includes('--h') || process.env.HEADLESS === 'true'
const isDevelopment = process.env.NODE_ENV === 'development' || process.argv.includes('--dev');

const log = new Log('main', true);

if (isDevelopment)
  log.info('Running in development mode');
else
  log.info('Running in production mode');

if (isHeadless)
  log.info('Headless mode');
else
  log.info('GUI mode');

if (enableHeapSnapshoot)
  setInterval(async () => {
    const { writeHeapSnapshot } = await import("v8")
    const file = writeHeapSnapshot(); // devuelve el nombre .heapsnapshot
    console.log('Snapshot guardado en:', file);
  }, 15000)

const coreProcesses = async () => {

  //server for panel and administration
  const mainServer = await ServerManager.createInstance({
    name: "main",
    port: 80,
    useSocketIO: true,
  })

  ipcServices.init(mainServer.getIO());

  if (!isDevelopment)
    mainServer.setStaticFiles(`${process.cwd()}/dist-react`);

  log.info(`Main server started on port ${mainServer.port} with Socket.IO enabled`);

  //server for general purpouses
  const generalServer = await ServerManager.createInstance({
    name: "general",
    port: 4546
  })

  log.info(`General purpose server started on port ${generalServer.port}.`);

  const { createApp } = await import('@domain/useCases/app/index.js');
  await createApp()

}

(async () => {

  if (isHeadless) {
    await coreProcesses();

  } else {

    const { app } = await import('electron');
    app.whenReady().then(async () => {
      await coreProcesses();
      const { createMainWindow } = await import('@domain/useCases/windowManager/index.js')
      await createMainWindow()

      log.info('App is ready');
    });

    app.on('window-all-closed', async () => {
      app.quit();
    });

    app.on('activate', async () => {
      const { createMainWindow } = await import('@domain/useCases/windowManager/index.js')
      await createMainWindow()
    });

    app.on('before-quit', () => {
      log.info('App is quitting');
    });

  }

})()
