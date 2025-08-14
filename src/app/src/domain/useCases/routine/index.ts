import { Project } from '@src/domain/entities/project';
import { Routine } from '@src/domain/entities/routine';
import { sendToClients } from '@src/services/eventBridge';
import { Log } from '@src/utils/log';
import { EventManager } from '@src/services/eventManager';
import routineEvents from '@common/events/routine.events';

const log = new Log("RoutineUseCases", true);
const eventManager = new EventManager();

export const createRoutine = (routineData): Routine => {
    const currentProject = Project.getInstance();

    const { enabled, ...rest } = routineData;
    const newRoutine = new Routine(rest);
    if (!newRoutine)
        throw new Error(`Failed to create routine with ID ${routineData.id}`);

    for (const taskId of routineData.tasksId || []) {
        if (taskId) {
            const task = currentProject.tasks.find(task => task.id === taskId);
            if (task)
                newRoutine.addTask(task);
            else
                log.warn(`Task with ID ${taskId} not found for routine ${newRoutine.id}`);
        } else {
            log.warn(`Task with ID ${taskId} not found for routine ${newRoutine.id}`);
        }
    }

    for (const triggerId of routineData.triggersId || []) {
        if (triggerId) {
            const trigger = currentProject.triggers.find(trigger => trigger.id === triggerId);
            if (trigger)
                newRoutine.addTrigger(trigger);
            else
                log.warn(`Trigger with ID ${triggerId} not found for routine ${newRoutine.id}`);
        } else {
            log.warn(`Trigger with ID ${triggerId} not found for routine ${newRoutine.id}`);
        }
    }

    log.info(`Routine ${newRoutine.name} loaded successfully with ID ${newRoutine.id}`);

    newRoutine.onAny((eventName, args) => {
        sendToClients(`routine.${newRoutine.id}.${eventName}`, { args });
        eventManager.emit(`routine.${newRoutine.id}.${eventName}`, { args });
    });


    eventManager.on(`user.routine.${newRoutine.id}.${routineEvents.routineAborted}`, () => {
        log.info(`User requested to abort routine ${newRoutine.id}`);
        newRoutine.abort("Routine aborted by user");
    });

    log.info(`Routine event broadcaster set up for routine ID ${newRoutine.id}`);

    if (enabled)
        newRoutine.enable();


    return newRoutine;
}