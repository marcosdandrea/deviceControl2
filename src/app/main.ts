import 'dotenv/config'
import { Log } from '@utils/log.js';
import ipcServices from '@src/services/ipcServices/index.js';

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

const coreProcesses = async () => {
  const server = await import('@src/services/server/index.js')
  const mainServer = await server.Server.getInstance({
    port: 3000,
    useSocketIO: true,
  });

  if (!isDevelopment){
    mainServer.setStaticFiles(`${process.cwd()}/dist-react`);
  }

  ipcServices.init(mainServer.getIO());

  log.info(`Server started on port 3000 with Socket.IO enabled`);

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
