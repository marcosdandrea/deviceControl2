import { RoutineType } from "@common/types/routine.type";
import { Project } from "@src/domain/entities/project";
import {Log} from "@src/utils/log";
import { nanoid } from "nanoid";

const log = Log.createInstance("RoutineService", true);

export const abortRoutine = (routineId: string, callback?: Function) => {
    log.info(`Aborting routine with ID: ${routineId}`);
    const project = Project.getInstance();
    const routine = project.getRoutines(routineId)?.[0];
    if (!routine) {
        log.warn(`Routine with ID: ${routineId} not found`);
        callback?.({error: "Routine not found"});
        return;
    }
    routine.abort("aborted by user");
    log.info(`Routine with ID: ${routineId} aborted`);
    callback?.({success: true});
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

export default {
    getRoutineTemplate,
    abortRoutine
}