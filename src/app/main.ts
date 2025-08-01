import 'dotenv/config'
import { app } from 'electron';
import { Log } from '@utils/log.js';

const log = new Log('main', true);
log.info('Starting app...');

app.on('ready', async () => {

  /*
  const server = await import('@src/services/server/index.js');
  await server.Server.getInstance({
    port: 3000,
  });
  
  log.info(`Server started on port 3000`);*/

  const {createApp} = await import('@domain/useCases/app/index.js');
  await createApp()
    
  const {createMainWindow} = await import('@domain/useCases/windowManager/index.js')
  await createMainWindow()
  
  const {registerEventBridge} = await import('@src/services/eventBridge/index.js')
  await registerEventBridge()
  log.info('App is ready');

});

app.on('window-all-closed', async () => {
  app.quit();
})



