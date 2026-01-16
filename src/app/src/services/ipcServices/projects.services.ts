
import { Project } from '@src/domain/entities/project';
import { Log } from '@src/utils/log';
import { ServerManager } from '../server/serverManager';
import { broadcastToClients } from '.';
import systemEvents from '@common/events/system.events';
import { ProjectStatus } from '@src/domain/useCases/project';

const log = Log.createInstance('IPC Project Services', true);

export const createNewProject = async (_payload: null, callback: Function) => {
    log.info('Client requested to create a new project');
    const { createNewProject } = await import('@src/domain/useCases/project/index.js');
    try {
        const project = await createNewProject();
        const createdProjectData = project.toJson();
        callback({ projectData: createdProjectData });
        log.info('New project created successfully and sent to client');
    } catch (error) {
        log.error(`Error creating new project: ${error.message}`);
        callback({ error: error.message });
    }
};

export const getCurrentProject = async (_payload: null, callback: Function) => {
    log.info('Client requested current project');
    const { getCurrentProject } = await import('@src/domain/useCases/project/index.js');
    try {
        const project = getCurrentProject();
        const loadedProjectData = project.toJson();
        callback({ projectData: loadedProjectData });
        log.info('Current project sent to client');
    } catch (error) {
        log.error(`Error getting current project: ${error.message}`);
        callback({ error: error.message });
    }
}

export const closeProject = async (_payload: null, callback: Function) => {
    log.info('Client requested to close the current project');
    const { closeProject } = await import('@src/domain/useCases/project/index.js');
    try {
        const { status, projectName } = await closeProject();
        if (status == ProjectStatus.projectClosed) {
            broadcastToClients(systemEvents.appLogInfo, { message: `Proyecto "${projectName}" cerrado` });
            callback?.({ success: true });
            log.info('Project closed successfully');
        } else if (status == ProjectStatus.projectWasClosed) {
            callback?.({ success: true });
            log.info('Project was already closed');
        }
    } catch (error) {
        log.error(`Error closing project: ${error.message}`);
        callback?.({ error: error.message });
    }
}

export const getProjectFromMemory = async (_payload: null, callback: Function) => {
    log.info('Client requested project file');
    try {
        const { getCurrentProject } = await import('@src/domain/useCases/project/index.js');
        const { encryptData } = await import('@src/services/cryptography/index.js');
        const currentProject = getCurrentProject();
        const projectFile = await encryptData(JSON.stringify(currentProject.toJson()));
        callback({ projectFile });
        log.info(`Project file sent to client`);
    } catch (error) {
        log.error(`Error getting project file: ${error.message}`);
        callback({ error: error.message });
    }
}

export const loadProjectFromFile = async (payload: ArrayBuffer | string, callback: Function) => {
    try {
        log.info('Client requested to load a project from file');

        const licenseIsValid = await import('@src/services/licensing/index.js').then(mod => mod.checkLicense()).catch(() => false);
        if (!licenseIsValid) {
            broadcastToClients(systemEvents.appLogError, { message: `No se pudo cargar el archivo del proyecto. La licencia del sistema no es válida.` });
            log.error(`Failed to load project file: License is not valid`);
            throw new Error("La licencia del sistema no es válida. Por favor, ingrese una licencia válida para cargar proyectos.");
        }


        const { closeProject, loadProjectFile } = await import('@src/domain/useCases/project/index.js');
        await closeProject();
        const generalServer = ServerManager.getInstance("general");
        generalServer.unbindAllRoutes();
        const project = await loadProjectFile(payload);
        callback({ projectData: payload });
        broadcastToClients(systemEvents.appLogInfo, { message: `Proyecto "${project?.name || "unknown"}" cargado.` });
        log.info(`Project loaded successfully`);
    } catch (error) {
        console.log(error);
        log.error(`Error loading project: ${error.message}`);
        callback({ error: error.message });
    }
}

export const loadProject = async (payload: string, callback: Function) => {
    try {
        log.info('Client requested to load a project from data');

        const licenseIsValid = await import('@src/services/licensing/index.js').then(mod => mod.checkLicense()).catch(() => false);
        if (!licenseIsValid) {
            broadcastToClients(systemEvents.appLogError, { message: `No se pudo cargar el proyecto. La licencia del sistema no es válida.` });
            log.error(`Failed to load project: License is not valid`);
            throw new Error("La licencia del sistema no es válida. Por favor, ingrese una licencia válida para cargar proyectos.");
        }

        const { closeProject, loadProject } = await import('@src/domain/useCases/project/index.js');

        await closeProject();
        const project = JSON.parse(payload) as Project;
        await loadProject(project);
        callback({ success: true });
        broadcastToClients(systemEvents.appLogSuccess, { message: `Proyecto cargado`, type: "success" });

        log.info(`Project loaded successfully`);
    } catch (error) {
        log.error(`Error loading project: ${error.message}`);
        callback({ error: error.message });
    }
}

export default {
    createNewProject,
    getCurrentProject,
    loadProjectFromFile,
    closeProject,
    loadProject,
    getProjectFromMemory
};