import projectServices from './projects.services';
import { Log } from '@src/utils/log';
import systemEvents from '@common/events/system.events';
import { getSystemTime } from './system.services';
import projectCommands from '@common/commands/project.commands';
import { ServerManager } from '../server/serverManager';
import projectsServices from './projects.services';

const log = new Log('IPC Services', false);

const init = (io: import('socket.io').Server) => {

    io.on('connection', (socket) => {
        log.info('New client connected:', socket.id);

        socket.on('disconnect', () => log.info('Client disconnected:', socket.id));
        
        //project
        socket.on(projectCommands.getCurrent, projectServices.getCurrentProject);
        socket.on(projectCommands.load, projectServices.loadProject);
        socket.on(projectCommands.close, projectsServices.closeProject);

        //system
        socket.on(systemEvents.getSystemTime, getSystemTime)
    });

    log.info('IPC Services initialized with Socket.IO');
}

export const broadcastToClients = async (eventName: string, payload: any) => {
    const mainServer = ServerManager.getInstance("main");
    const io = mainServer.getIO();

    if (!io) {
        log.error("Socket.IO instance not initialized. Cannot send event to clients.");
        return;
    }

    io.emit(eventName, payload);
    log.info(`Event "${eventName}" sent to clients with payload:`);
}

export default {
    init,
};