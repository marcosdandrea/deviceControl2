import projectEvents from '@common/events/project.events';
import SocketChannels from '@common/SocketChannels';
import { Project } from '@src/domain/entities/project';
import { Log } from '@src/utils/log';
import { Socket } from 'socket.io';
import SocketIO from 'socket.io';
import { Server } from '../server';

const log = new Log('IPC Project Services', true);

export const getCurrentProject = async (socket: Socket, io: SocketIO.Server) => {
    log.info('Client requested current project');
    const { getCurrentProject } = await import('@src/domain/useCases/project/index.js');
    try {
        const project = getCurrentProject();
        const loadedProjectData = project.toJson();
        socket.emit(projectEvents.loaded, loadedProjectData );
        log.info('Current project sent to client');
    } catch (error) {
        log.error('Error getting current project:', error.message);
        socket.emit(projectEvents.loaded, { error: error.message });
    }
}

export const loadProject = async (projectData: any, socket: Socket, io: SocketIO.Server) => {
     log.info('Client requested to load a project');
            const { loadProject } = await import('@src/domain/useCases/project/index.js');
            try {
                Project.close(); 
                const server = await Server.getInstance()
                server.unbindAllRoutes();
                await loadProject(projectData);
                log.info('Project loaded successfully');
            } catch (error) {
                console.log(error);
                log.error('Error loading project:', error.message);
                socket.emit(SocketChannels.loadProject, { error: error.message });
            }
}

export default {
    getCurrentProject,
    loadProject,
};