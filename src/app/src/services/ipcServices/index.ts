import projectServices from './projects.services';
import { Log } from '@src/utils/log';
import { checkTCPPortAvailability, checkUDPPortAvailability, getAppVersion, getNetworkInterfaces, getServerPorts, getSystemTime } from './system.services';
import projectCommands from '@common/commands/project.commands';
import { ServerManager } from '../server/serverManager';
import projectsServices from './projects.services';
import routineServeices from "./routine.services"
import appServices from './app.services';
import systemCommands from '@common/commands/system.commands';
import routineCommands from '@common/commands/routine.commands';
import appCommands from '@common/commands/app.commands';

const log = Log.createInstance('IPC Services', false);

const init = (io: import('socket.io').Server) => {

    io.on('connection', (socket) => {
        log.info('New client connected:', socket.id);

        socket.on('disconnect', () => log.info('Client disconnected:', socket.id));
        
        //system
        socket.on(systemCommands.getSystemTime, getSystemTime)
        socket.on(systemCommands.getAppVersion, getAppVersion)
        socket.on(systemCommands.getServerPorts, getServerPorts);
        socket.on(systemCommands.checkUDPPortAvailability, checkUDPPortAvailability);
        socket.on(systemCommands.checkTCPPortAvailability, checkTCPPortAvailability);
        socket.on(systemCommands.getNetworkInterfaces, getNetworkInterfaces);

        //app
        socket.on(appCommands.getTriggerTypes, appServices.getAvailableTriggers);
        socket.on(appCommands.getConditionTypes, appServices.getAvailableConditions);
        socket.on(appCommands.getJobTypes, appServices.getAvailableJobs);

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
        console.error("Socket.IO instance not initialized. Cannot send event to clients.");
        return;
    }

    io.emit(eventName, payload);
}

export default {
    init,
};