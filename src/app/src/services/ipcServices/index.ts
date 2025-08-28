import projectServices from './projects.services';
import { Log } from '@src/utils/log';
import { getAppVersion, getServerPorts, getSystemTime } from './system.services';
import projectCommands from '@common/commands/project.commands';
import { ServerManager } from '../server/serverManager';
import projectsServices from './projects.services';
import routineServeices from "./routine.services"
import systemCommands from '@common/commands/system.commands';
import routineCommands from '@common/commands/routine.commands';

const log = new Log('IPC Services', false);

const init = (io: import('socket.io').Server) => {

    io.on('connection', (socket) => {
        log.info('New client connected:', socket.id);

        socket.on('disconnect', () => log.info('Client disconnected:', socket.id));
        
        //system
        socket.on(systemCommands.getSystemTime, getSystemTime)
        socket.on(systemCommands.getAppVersion, getAppVersion)
        socket.on(systemCommands.getServerPorts, getServerPorts);
        
        //project
        socket.on(projectCommands.getCurrent, projectServices.getCurrentProject);
        socket.on(projectCommands.loadProjectFile, projectServices.loadProjectFile);
        socket.on(projectCommands.close, projectsServices.closeProject);
        socket.on(projectCommands.getProjectFile, projectsServices.getProjectFile);

        //routines
        socket.on(routineCommands.abort, routineServeices.abortRoutine);

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