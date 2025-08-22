
import { Project } from '@src/domain/entities/project';
import { Log } from '@src/utils/log';
import { ServerManager } from '../server/serverManager';
import { projectType } from '@common/types/project.types';

const log = new Log('IPC Project Services', true);

export const getCurrentProject = async (_payload: null, callback: Function) => {
    log.info('Client requested current project');
    const { getCurrentProject } = await import('@src/domain/useCases/project/index.js');
    try {
        const project = getCurrentProject();
        const loadedProjectData = project.toJson();
        callback({ projectData: loadedProjectData });
        log.info('Current project sent to client');
    } catch (error) {
        log.error('Error getting current project:', error.message);
        callback({ error: error.message });
    }
}

export const loadProject = async (payload: projectType, callback: Function) => {
    log.info('Client requested to load a project');
    const { loadProject } = await import('@src/domain/useCases/project/index.js');
    try {
        Project.close();
        const generalServer = ServerManager.getInstance("general");
        generalServer.unbindAllRoutes();
        await loadProject(payload);
        callback({ projectData: payload });
        log.info('Project loaded successfully');
    } catch (error) {
        console.log(error);
        log.error('Error loading project:', error.message);
        callback({ error: error.message });
    }
}

export const closeProject = async (_payload: null, callback: Function) => {
    log.info('Client requested to close the current project');
    const { closeProject } = await import('@src/domain/useCases/project/index.js');
    try {
        closeProject();
        callback?.({ success: true });
        log.info('Project closed successfully');
    } catch (error) {
        log.error('Error closing project:', error.message);
        callback?.({ error: error.message });
    }
}

export default {
    getCurrentProject,
    loadProject,
    closeProject
};