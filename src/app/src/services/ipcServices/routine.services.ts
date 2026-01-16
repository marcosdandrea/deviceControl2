import { RoutineType } from "@common/types/routine.type";
import { Project } from "@src/domain/entities/project";
import { Log } from "@src/utils/log";
import { nanoid } from "nanoid";
import { broadcastToClients } from ".";
import routineEvents from "@common/events/routine.events";
import { saveLastProject } from "@src/domain/useCases/project";

const log = Log.createInstance("RoutineService", true);

export const abortRoutine = (routineId: string, callback?: Function) => {
    log.info(`Aborting routine with ID: ${routineId}`);
    const project = Project.getInstance();
    const routine = project.getRoutines(routineId)?.[0];
    if (!routine) {
        log.warn(`Routine with ID: ${routineId} not found`);
        callback?.({ error: "Routine not found" });
        return;
    }
    routine.abort("aborted by user");
    log.info(`Routine with ID: ${routineId} aborted`);
    callback?.({ success: true });
};

export const getRoutineTemplate = (args: any, callback: Function) => {
    const defaultTimeout = process.env.ROUTINE_DEFAULT_TIMEOUT_MS ? parseInt(process.env.ROUTINE_DEFAULT_TIMEOUT_MS) : 60000;
    const defaultEnabled = process.env.ROUTINE_DEFAULT_ENABLED === "true";
    const defaultRunInSync = process.env.ROUTINE_DEFAULT_RUN_IN_SYNC === "true";
    const defaultHidden = process.env.ROUTINE_DEFAULT_HIDDEN === "true";
    const defaultContinueOnError = process.env.ROUTINE_DEFAULT_CONTINUE_ON_ERROR === "true";
    const defaultAutoCheckConditionEveryMs = process.env.ROUTINE_DEFAULT_AUTO_CHECK_CONDITIONS_EVERY_MS ? parseInt(process.env.ROUTINE_DEFAULT_AUTO_CHECK_CONDITIONS_EVERY_MS) : 0;

    const routineTemplate = {
        id: nanoid(8),
        name: "",
        description: "",
        groupId: null,
        timeout: defaultTimeout,
        tasksId: [],
        triggersId: [],
        enabled: defaultEnabled,
        runInSync: defaultRunInSync,
        hidden: defaultHidden,
        autoCheckConditionEveryMs: defaultAutoCheckConditionEveryMs,
        continueOnError: defaultContinueOnError,
    } as RoutineType

    callback?.(routineTemplate);
};

const changeRoutineEnabledState = async (routineId: string, enabled: boolean, callback?: Function) => {
    log.info(`${enabled ? "Enabling" : "Disabling"} routine with ID: ${routineId}`);
    const project = Project.getInstance();
    const routine = project.getRoutines(routineId)?.[0];
    if (!routine) {
        log.warn(`Routine with ID: ${routineId} not found`);
        callback?.({ error: "Routine not found" });
        return;
    }
    routine.enabled = enabled;
    log.info(`Routine with ID: ${routineId} ${enabled ? "enabled" : "disabled"}`);

    if (routine.memoizeUserDisable){
        await saveLastProject()
        log.info(`Routine with ID: ${routineId} enable state memoized to project`);
    }

    callback?.({ success: true });
};

const enableRoutine = async (args: any, callback?: Function) => {
    const { routineId } = args;
    log.info(`Enabling routine with ID: ${routineId}`);
    await changeRoutineEnabledState(routineId, true, callback);
    broadcastToClients(`routine.${routineId}.${routineEvents.routineEnabledStatusChanged}`, { routineId, enabled: true });
};

const disableRoutine = async (args: any, callback?: Function) => {
    const { routineId } = args;
    log.info(`Disabling routine with ID: ${routineId}`);
    await changeRoutineEnabledState(routineId, false, callback);
    broadcastToClients(`routine.${routineId}.${routineEvents.routineEnabledStatusChanged}`, { routineId, enabled: false });
};

export default {
    getRoutineTemplate,
    abortRoutine,
    enableRoutine,
    disableRoutine,
}