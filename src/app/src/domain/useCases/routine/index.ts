import { Project } from '@src/domain/entities/project';
import { Routine } from '@src/domain/entities/routine';
import { Log } from '@src/utils/log';
import { EventManager } from '@src/services/eventManager';
import routineEvents from '@common/events/routine.events';
import projectEvents from '@common/events/project.events';
import { broadcastToClients } from '@src/services/ipcServices';
import { writeFile, deleteFile as removeFile } from '@src/services/fileSystem';
import { Task } from '@src/domain/entities/task';
import { createNewJobByType } from '@src/domain/entities/job/types';
import { createNewConditionByType } from '@src/domain/entities/conditions/types';
import { Condition } from '@src/domain/entities/conditions';
import { Job } from '@src/domain/entities/job';
import path from "path";
import { promises as fs } from "fs";

const log = Log.createInstance("routineUseCase", true);
const eventManager = new EventManager();

const EXECUTIONS_LOG_DEPTH_PER_ROUTINE = Number(process.env.EXECUTIONS_LOG_DEPTH_PER_ROUTINE || "0");

const enforceExecutionLogDepthForRoutine = async (routineId: string) => {
  if (!EXECUTIONS_LOG_DEPTH_PER_ROUTINE || EXECUTIONS_LOG_DEPTH_PER_ROUTINE <= 0) {
    return;
  }

  const routineLogPath = path.resolve(process.cwd(), "logs", "routines", routineId);

  try {
    const files = await fs.readdir(routineLogPath);
    const jsonFiles = files.filter(file => file.endsWith(".json"));

    if (jsonFiles.length <= EXECUTIONS_LOG_DEPTH_PER_ROUTINE) {
      return;
    }

    const filesWithStats = await Promise.all(jsonFiles.map(async file => {
      const filePath = path.join(routineLogPath, file);
      const stats = await fs.stat(filePath);
      const sortValue = stats.birthtimeMs || stats.ctimeMs || stats.mtimeMs;
      return { filePath, sortValue };
    }));

    filesWithStats.sort((a, b) => a.sortValue - b.sortValue);

    const filesToRemove = filesWithStats.slice(0, filesWithStats.length - EXECUTIONS_LOG_DEPTH_PER_ROUTINE);

    await Promise.all(filesToRemove.map(async file => {
      await removeFile(file.filePath);
    }));
  } catch (error) {
    const err = error as NodeJS.ErrnoException;
    if (err?.code !== "ENOENT") {
      log.warn(`Failed to enforce execution log depth for routine ${routineId}: ${String(error)}`);
    }
  }
};

// Registro: por cada rutina guardamos sólo WeakRef y disposers (no retenemos fuerte la instancia)
type RoutineCleanup = {
  ref: WeakRef<Routine>;
  disposers: Array<() => void>;
};
const routineRegistry = new Map<string, RoutineCleanup>();

export const createRoutine = async (routineData, projectData): Promise<Routine> => {
  const currentProject = Project.getInstance();

  const { enabled, ...rest } = routineData;
  const routine = new Routine(rest);
  if (!routine)
    throw new Error(`Failed to create routine with ID ${routineData.id}`);


  const createRoutineTask = async (taskData): Promise<Task> => {
    const newTask = new Task(taskData);
    let jobTask: Job = null;
    let conditionTask: Condition = null;

    if (!newTask)
      throw new Error(`Failed to create task with ID ${taskData.id}`);


    if (taskData.job) {
      try {
        jobTask = await createNewJobByType(taskData.job.type, taskData.job);
      } catch (error) {
        throw new Error(`Error creating job "${taskData.job.name}" for task "${taskData.name}": ${error.message}`);
      }
      if (!jobTask)
        throw new Error(`Failed to create job for task with ID ${taskData.id}`);

      newTask.setJob(jobTask);
    }

    if (taskData.condition) {
      conditionTask = await createNewConditionByType(taskData.condition.type, taskData.condition);
      if (!conditionTask)
        throw new Error(`Failed to create condition for task with ID ${taskData.id}`);

      newTask.setCondition(conditionTask);
    }
    return newTask;
  }

  // ---- Crear tasks a la rutina ----
  for (const taskInstance of routineData.tasksId || []) {
    if (taskInstance?.taskId) {
      const taskData = projectData.tasks.find(t => t.id === taskInstance.taskId);
      if (!taskData) {
        log.warn(`Task with ID ${taskInstance.taskId} not found for routine ${routine.id}`);
        continue;
      }
      const task = await createRoutineTask(taskData);
      routine.addTask(task, taskInstance.id);
    }
  }

  // ---- Asociar triggers ----
  for (const triggerInstance of routineData.triggersId || []) {
    if (triggerInstance?.triggerId) {
      const trigger = currentProject.triggers.find(t => t.id === triggerInstance.triggerId);
      if (trigger) {
        routine.addTrigger(trigger, triggerInstance.id);
      }
      else log.warn(`Trigger with ID ${triggerInstance.triggerId} not found for routine ${routine.id}`);
    } else {
      log.warn(`Trigger with ID ${triggerInstance?.triggerId} not found for routine ${routine.id}`);
    }
  }

  log.info(`Routine ${routine.name} loaded successfully with ID ${routine.id}`);

  // =========================
  //   LISTENERS + DISPOSERS
  // =========================
  const id = routine.id;
  const routineWeakRef = new WeakRef(routine);
  const disposers: Array<() => void> = [];

  // 1) Bridge Routine → clientes + bus (no captura 'routine')
  const onAnyListener = (eventName: string, args: any) => {
    broadcastToClients(`routine.${id}.${eventName}`, { args });
    eventManager.emitEvent(`routine.${id}.${eventName}`, { args });

  };

  routine.onAny(onAnyListener);

  const handleOnFinish = async (payload: { [key: string]: any }) => {

    try {
      const execution = payload[0];
      const executionId = execution.executionId;

      const triggeredBy = {
        id: execution.fullTree[executionId].id,
        type: execution.fullTree[executionId].type,
        name: execution.fullTree[executionId].name,
        ts: execution.fullTree[executionId].ts,
      }

      const logData = execution.log;
      const data = {
        executionId,
        triggeredBy,
        log: logData,
      };

      await writeFile(`./logs/routines/${id}/${executionId}.json`, JSON.stringify(data));
      await enforceExecutionLogDepthForRoutine(id);
      await broadcastToClients(projectEvents.executionsUpdated, { routineId: id });

    } catch (error) {
      log.error(`Failed to persist execution log for routine ${id}:`, error);
    }

  };

  routine.on(routineEvents.routineFinished, handleOnFinish);

  disposers.push(() => {
    const r = routineWeakRef.deref();
    r?.offAny(onAnyListener);
    r?.off(routineEvents.routineFinished, handleOnFinish);
  });


  // Registrar cleanup en el registro global (para uso de removeRoutine)
  routineRegistry.set(id, { ref: routineWeakRef, disposers });

  log.info(`Routine event broadcaster set up for routine ID ${id}`);

  if (enabled) routine.enable();

  return routine;
};

export const removeRoutine = (routineID: string) => {
  const entry = routineRegistry.get(routineID);

  // Siempre intentamos limpiar el listener de abort por si existe
  const abortEvent = `user.routine.${routineID}.${routineEvents.routineAborted}`;

  if (!entry) {
    // Fallback: si no tenemos entry, al menos limpiamos los listeners de ese evento
    eventManager.removeAllListeners(abortEvent);
    log.warn(`removeRoutine(${routineID}): no registry entry found. Removed listeners for ${abortEvent}.`);
    return;
  }

  // Ejecutar disposers (offAny + off del EventManager)
  for (const dispose of entry.disposers) {
    try { dispose?.(); } catch (e) {
      log.warn(`removeRoutine(${routineID}): disposer threw`, { error: String(e) });
    }
  }

  // Borrar del registro
  routineRegistry.delete(routineID);

  // Limpieza adicional defensiva: quitar cualquier listener restante para este evento
  eventManager.removeAllListeners(abortEvent);

  log.info(`removeRoutine(${routineID}): cleanup completed.`);
};
