import { projectType } from "@common/types/project.types";
import { Project, ProjectConstructor } from "@src/domain/entities/project"
import { Routine } from "@src/domain/entities/routine";
import { Task } from "@src/domain/entities/task";
import { Trigger } from "@src/domain/entities/trigger";
import { createNewTriggerByType } from "@src/domain/entities/trigger/types";
import { Log } from "@src/utils/log";
import { deleteFile, readFile, writeFile } from "@src/services/fileSystem"
import { setMainWindowTitle } from "../windowManager/mainWindowTitleManager";
import { EventManager } from "@src/services/eventManager";
import projectEvents from "@common/events/project.events";
import { createRoutine } from "../routine";
import { broadcastToClients } from "@src/services/ipcServices";
import { clearProjectContext } from "../context";
import { nanoid } from "nanoid";
import { version as appVersion } from '../../../../../../package.json';
import dictionary from "@common/i18n";
import os from "os";
import systemEvents from "@common/events/system.events";
import { getUserDataPath } from "@src/utils/paths";
import path from "path";
import { decryptData, encryptData } from "@src/services/cryptography";

const log = Log.createInstance("projectUseCases", true);
const eventManager = new EventManager();

let lastOpenedProjectId = undefined
const currentProjectFilename = process.env.CURRENT_PROJECT_FILENAME || "currentProject.dc2"

const defaultProject = {
   id: nanoid(10),
   appVersion,
   name: dictionary("app.domain.useCases.project.newProject"),
   description: "",
   createdBy: os.userInfo().username,
   createdAt: new Date().toISOString(),
   updatedAt: new Date().toISOString(),
   password: null,
   routines: [],
   triggers: [],
   tasks: []
} as unknown as ProjectConstructor;

export const createNewProject = async (): Promise<Project> => {
   let project = Project.getInstance()

   if (project) {
      if (project.hasUnsavedChanges())
         throw new Error("There are unsaved changes in the current project. Please save or discard them before creating a new project.");
      else
         Project.close();
   }

   project = Project.createInstance(defaultProject)

   lastOpenedProjectId = project.id;
   await saveLastProject();

   log.info("New project created successfully");
   broadcastToClients(systemEvents.appLogInfo, { message: `Nuevo proyecto creado con éxito.` });
   eventManager.emit(projectEvents.created, project);
   return project

}

export const saveProject = async (filePath: string, projectName: string): Promise<projectType> => {

   if (!filePath)
      throw new Error("File path is required to save the project.")

   const fileSystemRegex = /^(\/|[a-zA-Z]:\\)/

   if (!fileSystemRegex.test(filePath)) {
      log.error("Invalid file path provided. Please provide an absolute file path.");
      throw new Error("Invalid file path provided. Please provide an absolute file path.");
   }

   const project = Project.getInstance();
   project.setName(projectName)
   setMainWindowTitle(project.name);
   const projectData = project.toJson();

   try {
      await writeFile(filePath, JSON.stringify(projectData, null, 2))
      log.info(`Project saved successfully to ${filePath}`);
      broadcastToClients(systemEvents.appLogInfo, { message: `Proyecto "${project.name}" guardado con éxito.` });
      eventManager.emit(projectEvents.saved, project);
   } catch (error) {
      log.error(`Failed to save project to ${filePath}:`, error);
      throw new Error(`Failed to save project: ${error.message}`);
   }

   return projectData;
}

export const loadProject = async (projectData: projectType): Promise<Project> => {

   if (!projectData) {
      log.error("Project data must be provided.");
      throw new Error("Project data must be provided.");
   }

   let project: Project = null;
   const triggers: Record<string, Trigger> = {}
   const routines: Record<string, Routine> = {}
   const tasks: Record<string, Task> = {}

   log.info("Loading project...");

   // check that major and minor version match
   const [major, minor] = projectData.appVersion.split(".").map(Number);
   const [appMajor, appMinor] = appVersion.split(".").map(Number);
   if (major !== appMajor) {
      //broadcastToClients(systemEvents.appLogError, { message: `No se pudo cargar el proyecto con la versión ${projectData.appVersion}. Se esperaba al menos la versión ${appVersion}.x` });
      throw new Error(`Versión del proyecto ${projectData.appVersion}. Se esperaba al menos la versión ${appVersion}.x`);
   } else if (minor > appMinor) {
      log.warn(`Version de proyecto: ${projectData.appVersion}. Versión del sistema: ${appVersion}.${appMinor}. Puede que el proyecto contenga errores.`);
      broadcastToClients(systemEvents.appLogError, { message: `El proyecto ha sido creado con una versión de Device Control más reciente (${projectData.appVersion}). Se intentará cargar el proyecto pero podría contener errores.` });
   }

   try {

      if (!projectData || !projectData.id)
         throw new Error("Invalid project data provided.");

      log.info("Checking for existing project instance...");

      project = Project.getInstance();
      if (!project)
         throw new Error("No project instance found. Creating a new one.");

      const projectId = project.id;

      if (projectId !== lastOpenedProjectId) {
         log.warn("Removing execution log files from previous project instance.");
         await clearProjectContext();
         lastOpenedProjectId = undefined;
         log.info("Execution log files cleared successfully.");
      }

      log.warn("Closing the current project before loading a new one.");
      Project.close();

   } catch (error) {
      log.error("Project instance not found. Creating a new project instance.");
   }

   const createTriggers = async () => {
      log.info("Loading triggers...");

      for (const triggerData of projectData.triggers || []) {
         const newTrigger = await createNewTriggerByType(triggerData.type, triggerData);

         if (!newTrigger) {
            broadcastToClients(systemEvents.appLogError, { message: `No se pudo cargar el trigger ${triggerData.name} (${triggerData.id}) de tipo ${triggerData.type}` });
            log.error(`Failed to create trigger of type ${triggerData.type}`);
            continue;
         }

         if (triggers[triggerData.id])
            continue

         triggers[triggerData.id] = newTrigger;
      }

   }

   const createRoutines = async () => {
      log.info("Loading routines...");

      for (const routineData of projectData.routines || []) {
         if (routines[routineData.id])
            continue

         try {
            const newRoutine = await createRoutine(routineData, projectData);
            routines[routineData.id] = newRoutine;
         } catch (error) {
            broadcastToClients(systemEvents.appLogError, { message: `No se pudo cargar la rutina ${routineData.name} (${routineData.id}): ${error.message}` });
            log.error(`Failed to create routine with ID ${routineData.id}: ${error.message}`);
            continue;
         }

      }
   }

   await createTriggers();

   project = Project.createInstance({
      ...projectData,
      routines: [],
      triggers: Object.values(triggers),
      tasks: Object.values(tasks)
   })

   await createRoutines();
   project.routines = Object.values(routines);
   project.onAny(broadcastToClients)

   lastOpenedProjectId = project.id;

   setMainWindowTitle(project.name);

   broadcastToClients(projectEvents.loaded, { projectData: project.toJson() });
   eventManager.emit(projectEvents.loaded, project);
   saveLastProject();
   return Promise.resolve(project)

}

export const saveLastProject = async (): Promise<void> => {
   const project = Project.getInstance();
   if (!project)
      throw new Error("No project is currently loaded.");
   const projectData = project.toJson();
   const recentLoadedProjectFile = path.join(await getUserDataPath(), currentProjectFilename)

   try {
      const projectDataString = JSON.stringify(projectData, null, 2);
      const filedataEncrypted = await encryptData(projectDataString);
      await writeFile(recentLoadedProjectFile, filedataEncrypted);
      log.info(`Project auto-saved successfully to ${recentLoadedProjectFile}`);
   } catch (error) {
      log.error(`Failed to auto-save project to ${recentLoadedProjectFile}:`, error);
      throw new Error(`Failed to auto-save project: ${error.message}`);
   }
}

export const getLastProject = async (): Promise<projectType> => {
   const recentLoadedProjectFile = path.join(await getUserDataPath(), currentProjectFilename)

   try {
      const filedataEncrypted = await readFile(recentLoadedProjectFile, false);
      const filedataDecrypted = await decryptData(filedataEncrypted as string);
      const projectData = JSON.parse(filedataDecrypted as string) as projectType;
      return projectData;
   } catch (error) {
      log.error(`Failed to load last project:`, error);
      throw new Error("Failed to load last project");
   }
}

export const loadLastProject = async (): Promise<projectType> => {
   try {
      const projectContent = await getLastProject();
      if (!projectContent)
         throw new Error("No last project found.");
      await loadProject(projectContent);
      log.info(`Last project loaded successfully: ${projectContent.name}`);
      return projectContent;
   } catch (error) {
      log.error(`Failed to load last project:`, error);
      throw new Error("Failed to load last project");
   }
}

export const loadProjectFile = async (fileContent: string | ArrayBuffer): Promise<Project | string> => {

   try {
      const { decryptData } = await import('@src/services/cryptography/index.js');
      const projectRawData = await decryptData(String(fileContent) as string);
      const projectContent = JSON.parse(projectRawData);
      await loadProject(projectContent);
      await saveLastProject();
      log.info(`Project file loaded successfully: ${projectContent.name}`);
      broadcastToClients(systemEvents.appLogInfo, { message: `Proyecto "${projectContent.name}" cargado.` });
   } catch (error) {
      console.error(error);
      broadcastToClients(systemEvents.appLogError, { message: `No se pudo cargar el archivo del proyecto: ${error.message}` });
      log.error(`Failed to load project file: ${error.message}`);
      return null;
   }

}

export const closeProject = async (): Promise<void> => {
   try {
      const project = Project.getInstance();

      if (!project)
         return;

      Project.close();
      await removeCurrentProjectFile();
      setMainWindowTitle(null);
      broadcastToClients(projectEvents.closed, { projectData: {} });
      eventManager.emit(projectEvents.closed);
      broadcastToClients(systemEvents.appLogInfo, { message: `Proyecto cerrado` });
      log.info("Project closed successfully");
   } catch (error) {
      log.error("Error closing project:", error);
      broadcastToClients(systemEvents.appLogError, { message: `Error al cerrar el proyecto: ${error.message}` });
   }
}

export const getCurrentProject = (): Project => {
   const project = Project.getInstance();
   if (!project)
      throw new Error("No project is currently loaded.");

   return project;
}

export const removeCurrentProjectFile = async (): Promise<void> => {
   try {
      const recentLoadedProjectFile = path.join(await getUserDataPath(), currentProjectFilename)
      await deleteFile(recentLoadedProjectFile);
   } catch (error) {
      log.error("Error removing current project file:", error);
   }
}