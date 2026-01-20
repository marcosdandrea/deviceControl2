import projectServices from './projects.services';
import { Log } from '@src/utils/log';
import { checkTCPPortAvailability, checkUDPPortAvailability, getAppVersion, getServerIp, getServerPorts, getSystemTime } from './system.services';
import projectCommands from '@common/commands/project.commands';
import { ServerManager } from '../server/serverManager';
import projectsServices from './projects.services';
import routineServeices from "./routine.services"
import appServices from './app.services';
import systemCommands from '@common/commands/system.commands';
import routineCommands from '@common/commands/routine.commands';
import appCommands from '@common/commands/app.commands';
import executionsServices from './executions.services';
import tasksCommands from '@common/commands/tasks.commands';
import tasksServices from './tasks.services';
import hardwareServices from './hardware.services';
import { NetworkCommands } from '@common/commands/net.commands';
import networkServices from './network.services';
import { ScreenCommands } from '@common/commands/screen.commands';



const log = Log.createInstance('IPC Services', false);

const init = (io: import('socket.io').Server) => {

    
    io.on('connection', (socket) => {
        log.info('New client connected:', socket.id);
        
        socket.on('disconnect', () => log.info('Client disconnected:', socket.id));
        
        //system
        socket.on(systemCommands.getSystemTime, getSystemTime)
        socket.on(systemCommands.getAppVersion, getAppVersion)
        socket.on(systemCommands.getServerPorts, getServerPorts);
        socket.on(systemCommands.getServerIp, getServerIp);
        socket.on(systemCommands.checkUDPPortAvailability, checkUDPPortAvailability);
        socket.on(systemCommands.checkTCPPortAvailability, checkTCPPortAvailability);
        socket.on(systemCommands.getIsSignedHardware, hardwareServices.isSignedHarware);
        
        //license
        socket.on(appCommands.setLicense, appServices.setLicense);
        socket.on(appCommands.checkLicense, appServices.checkLicense);
        socket.on(appCommands.deleteLicense, appServices.deleteLicense);
        
        //network
        socket.on(NetworkCommands.getNetworkStatus, networkServices.getNetworkStatus);
        socket.on(NetworkCommands.setNetworkConfiguration, networkServices.setNetworkConfiguration);
        
        //screen
        socket.on(ScreenCommands.turnScreenOn, hardwareServices.turnScreenOn);
        socket.on(ScreenCommands.turnScreenOff, hardwareServices.turnScreenOff);

        //app
        socket.on(appCommands.getTriggerTypes, appServices.getAvailableTriggers);
        socket.on(appCommands.getConditionTypes, appServices.getAvailableConditions);
        socket.on(appCommands.getJobTypes, appServices.getAvailableJobs);
        socket.on(appCommands.blockMainControl, (args: any, callback: Function) => appServices.blockMainControlView(socket, callback));
        socket.on(appCommands.unblockMainControl, (args: any, callback: Function) => appServices.unblockMainControlView(socket, callback));

        //project
        socket.on(projectCommands.create, projectServices.createNewProject);
        socket.on(projectCommands.getCurrent, projectServices.getCurrentProject);
        socket.on(projectCommands.load, projectServices.loadProject);
        socket.on(projectCommands.loadProjectFile, projectServices.loadProjectFromFile);
        socket.on(projectCommands.close, projectsServices.closeProject);
        socket.on(projectCommands.getProjectFile, projectsServices.getProjectFromMemory);

        //executions
        socket.on(projectCommands.getExecutions, executionsServices.getExecutionsList);
        socket.on(projectCommands.getExecution, executionsServices.getExecution);
        socket.on(projectCommands.deleteExecution, executionsServices.deleteExecution);
        socket.on(projectCommands.downloadExecutions, executionsServices.downloadExecutions);
        socket.on(projectCommands.deleteExecutions, executionsServices.deleteExecutions);
        socket.on(projectCommands.deleteAllExecutions, executionsServices.deleteAllExecutions);

        //routines
        socket.on(routineCommands.abort, routineServeices.abortRoutine);
        socket.on(routineCommands.getRoutineTemplate, routineServeices.getRoutineTemplate);
        socket.on(routineCommands.enableRoutine, routineServeices.enableRoutine);
        socket.on(routineCommands.disableRoutine, routineServeices.disableRoutine);

        //tasks
        socket.on(tasksCommands.getTaskTemplate, tasksServices.getTaskTemplate);



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