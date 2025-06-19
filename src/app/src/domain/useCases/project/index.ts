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
import { readFile, writeFile } from "@services/fileSystem"
import { setMainWindowTitle } from "../windowManager/mainWindowTitleManager";
import { EventManager } from "@src/services/eventManager";
import projectEvents from "@common/events/project.events";

const log = new Log("ProjectUseCases");
const eventManager = new EventManager();

export const createNewProject = async (projectData?: projectType): Promise<Project> => {
   let project = Project.getInstance()

   if (project) {
      if (project.hasUnsavedChanges())
         throw new Error("There are unsaved changes in the current project. Please save or discard them before creating a new project.");
      else
         project.close();
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

export const loadProject = async (filePath: string): Promise<Project> => {

   let projectData: projectType = null;

   if (!filePath) {
      log.error("File path is required to load the project.");
      throw new Error("File path is required to load the project.");
   }

   const fileSystemRegex = /^(\/|[a-zA-Z]:\\)/;
   if (!fileSystemRegex.test(filePath)) {
      log.error("Invalid file path provided. Please provide an absolute file path.");
      throw new Error("Invalid file path provided. Please provide an absolute file path.");
   }

   log.info(`Loading project from ${filePath}`);

   try {
      projectData = await readFile(filePath);
   } catch (error) {
      throw new Error(`Failed to load project from ${filePath}: ${error.message}`);
   }

   let project: Project = null;
   const triggers: Record<string, Trigger> = {}
   const routines: Record<string, Routine> = {}
   const tasks: Record<string, Task> = {}

   log.info("Loading project data...");

   if (!projectData || !projectData.id) {
      log.error("Invalid project data provided.");
      throw new Error("Invalid project data provided.");
   }

   try {
      project = Project.getInstance();
      if (project)
         throw new Error("Project instance already exists. Please close the current project before loading a new one.");
      project.close()
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

   const createTasks = async () => {
      log.info("Loading tasks...");

      for (const taskData of projectData.tasks || []) {

         if (tasks[taskData.id])
            continue

         const newTask = new Task(taskData);
         let jobTask: Job = null;
         let conditionTask: Condition = null;

         if (!newTask) {
            log.error(`Failed to create task with ID ${taskData.id}`);
            continue;
         }

         if (taskData.job) {
            jobTask = await createNewJobByType(taskData.job.type, taskData.job);
            if (!jobTask) {
               log.error(`Failed to create job for task with ID ${taskData.id}`);
               continue;
            }
            newTask.setJob(jobTask);
         }

         if (taskData.condition) {
            conditionTask = await createNewConditionByType(taskData.condition.type, taskData.condition);
            if (!conditionTask) {
               log.error(`Failed to create condition for task with ID ${taskData.id}`);
               continue;
            }
            newTask.setCondition(conditionTask);
         }

         tasks[taskData.id] = newTask;
      }
   }

   const createRoutines = async () => {
      log.info("Loading routines...");
      for (const routineData of projectData.routines || []) {
         if (routines[routineData.id])
            continue

         const newRoutine = new Routine(routineData);
         if (!newRoutine) {
            log.error(`Failed to create routine with ID ${routineData.id}`);
            continue;
         }

         for (const task of routineData.tasks || []) {
            const newTask = tasks[task.id];
            if (task) {
               newRoutine.addTask(newTask);
            } else {
               log.warn(`Task with ID ${newTask.id} not found for routine ${routineData.id}`);
            }
         }

         for (const trigger of routineData.triggers || []) {
            const newTrigger = triggers[trigger.id];
            if (newTrigger) {
               newRoutine.addTrigger(newTrigger);
            } else {
               log.warn(`Trigger with ID ${newTrigger.id} not found for routine ${routineData.id}`);
            }
         }

         routines[routineData.id] = newRoutine;
      }
   }

   await createTriggers();
   await createTasks();
   await createRoutines();

   project = Project.createInstance({
      ...projectData,
      routines: Object.values(routines),
      triggers: Object.values(triggers),
      tasks: Object.values(tasks)
   })

   setMainWindowTitle(project.name);
   eventManager.emit(projectEvents.opened, project);
   return Promise.resolve(project)

}

export const closeProject = (): void => {
   const project = Project.getInstance();
   if (!project)
      return
   project.close();
   setMainWindowTitle(null);
   log.info("Project closed successfully");
   eventManager.emit(projectEvents.closed, project);
}