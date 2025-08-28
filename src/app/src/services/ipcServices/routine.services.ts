import { Project } from "@src/domain/entities/project";
import {Log} from "@src/utils/log";

const log = new Log("RoutineService", true);

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

export default {
    abortRoutine
}