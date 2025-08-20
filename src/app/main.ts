import 'dotenv/config'
import { app } from 'electron';
import { Log } from '@utils/log.js';
import ipcServices from '@src/services/ipcServices/index.js';

const log = new Log('main', true);
log.info('Starting app...');

app.on('ready', async () => {

  const server = await import('@src/services/server/index.js')
  const mainServer = await server.Server.getInstance({
    port: 3000,
    useSocketIO: true,
  });

  ipcServices.init(mainServer.getIO());

  log.info(`Server started on port 3000 with Socket.IO enabled`);

  const {createApp} = await import('@domain/useCases/app/index.js');
  await createApp()
    
  const {createMainWindow} = await import('@domain/useCases/windowManager/index.js')
  await createMainWindow()
  
  log.info('App is ready');

});

app.on('window-all-closed', async () => {
  app.quit();
})



