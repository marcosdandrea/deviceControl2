import { projectType } from "@common/types/project.types";
import { Condition } from "@src/domain/entities/conditions";
import { createNewConditionByType } from "@src/domain/entities/conditions/types";
import { Job } from "@src/domain/entities/job";
import { createNewJobByType } from "@src/domain/entities/job/types";
import { Project } from "@src/domain/entities/project"
import { Routine } from "@src/domain/entities/routine";
import { Task } from "@src/domain/entities/task";
import { Trigger } from "@src/domain/entities/trigger";
import { createNewTriggerByType } from "@src/domain/entities/trigger/types";
import { Log } from "@src/utils/log";
import { writeFile } from "@src/services/fileSystem"
import { setMainWindowTitle } from "../windowManager/mainWindowTitleManager";
import { EventManager } from "@src/services/eventManager";
import projectEvents from "@common/events/project.events";
import { createRoutine } from "../routine";
import { broadcastToClients } from "@src/services/ipcServices";

const log = Log.createInstance("projectUseCases", true);
const eventManager = new EventManager();

export const createNewProject = async (projectData?: projectType): Promise<Project> => {
   let project = Project.getInstance()

   if (project) {
      if (project.hasUnsavedChanges())
         throw new Error("There are unsaved changes in the current project. Please save or discard them before creating a new project.");
      else
         Project.close();
   }

   project = Project.createInstance({
      ...projectData,
      routines: [],
      triggers: [],
      tasks: []
   })

   log.info("New project created successfully");
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

   log.info("Loading project data...");

   try {

      if (!projectData || !projectData.id) 
         throw new Error("Invalid project data provided.");

      log.info("Checking for existing project instance...");

      project = Project.getInstance();
      if (!project)
         throw new Error("No project instance found. Creating a new one.");

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
            console.error(error)
            log.error(`Failed to create routine with ID ${routineData.id}:`, error.message);
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

   setMainWindowTitle(project.name);

   broadcastToClients(projectEvents.loaded, { projectData: project.toJson() });
   eventManager.emit(projectEvents.loaded, project);
   return Promise.resolve(project)

}

export const loadProjectFile = async (fileContent: string | ArrayBuffer): Promise<Project | string> => {

   try {
      const {decryptData} = await import('@src/services/cryptography/index.js');
      const projectRawData = await decryptData(fileContent) as string;
      const projectContent = JSON.parse(projectRawData);
      await loadProject(projectContent);
      log.info("Project file loaded successfully:", projectContent.name);
   } catch (error) {
      log.error("Error loading project file:", error);
      return null;
   }

}

export const closeProject = (): void => {

   Project.close();
   setMainWindowTitle(null);

   broadcastToClients(projectEvents.closed, { projectData: {} });
   eventManager.emit(projectEvents.closed);
   log.info("Project closed successfully");
}

export const getCurrentProject = (): Project => {
   const project = Project.getInstance();
   if (!project)
      throw new Error("No project is currently loaded.");

   return project;
}