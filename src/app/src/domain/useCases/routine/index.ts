import { Project } from '@src/domain/entities/project';
import { Routine } from '@src/domain/entities/routine';
import { Log } from '@src/utils/log';
import { EventManager } from '@src/services/eventManager';
import routineEvents from '@common/events/routine.events';
import { broadcastToClients } from '@src/services/ipcServices';

const log = new Log("routineUseCase", true);
const eventManager = new EventManager();

// Registro: por cada rutina guardamos sólo WeakRef y disposers (no retenemos fuerte la instancia)
type RoutineCleanup = {
  ref: WeakRef<Routine>;
  disposers: Array<() => void>;
};
const routineRegistry = new Map<string, RoutineCleanup>();

export const createRoutine = (routineData): Routine => {
  const currentProject = Project.getInstance();

  const { enabled, ...rest } = routineData;
  const routine = new Routine(rest);
  if (!routine)
    throw new Error(`Failed to create routine with ID ${routineData.id}`);

  // ---- Asociar tasks ----
  for (const taskId of routineData.tasksId || []) {
    if (taskId) {
      const task = currentProject.tasks.find(t => t.id === taskId);
      if (task) routine.addTask(task);
      else log.warn(`Task with ID ${taskId} not found for routine ${routine.id}`);
    } else {
      log.warn(`Task with ID ${taskId} not found for routine ${routine.id}`);
    }
  }

  // ---- Asociar triggers ----
  for (const triggerId of routineData.triggersId || []) {
    if (triggerId) {
      const trigger = currentProject.triggers.find(t => t.id === triggerId);
      if (trigger) routine.addTrigger(trigger);
      else log.warn(`Trigger with ID ${triggerId} not found for routine ${routine.id}`);
    } else {
      log.warn(`Trigger with ID ${triggerId} not found for routine ${routine.id}`);
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

  disposers.push(() => {
    const r = routineWeakRef.deref();
    r?.offAny(onAnyListener);
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
