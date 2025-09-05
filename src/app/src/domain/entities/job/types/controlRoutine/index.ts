import { JobType, requiredJobParamType } from "@common/types/job.type";
import { jobTypes } from "..";
import { Job } from "../..";
import jobEvents from "@common/events/job.events";
import { EventManager } from "@src/services/eventManager";
import { RoutineActions } from "@src/domain/entities/routine";

interface controlRoutineInterface extends JobType {
    params: {
        routineId: string;
        action: RoutineActions ;
    } & Record<string, any>
}

export class ControlRoutineJob extends Job {
    static name = "Control Routine Job"
    static description = "Controls a routine by enabling, disabling, running, or stopping it."
    static type = jobTypes.controlRoutineJob;

    private eventManager: EventManager;

    constructor(options: controlRoutineInterface){
        super({
            ...options,
            timeout: 5000,
            enableTimoutWatcher: true,
            type: jobTypes.controlRoutineJob,
        });

        this.eventManager = new EventManager();
        this.validateParams();
    }

    #controlRoutinesThrowEventManager(rutineId: string, action: string): void {
        const eventName = `routineId:${rutineId}`;
        this.eventManager.emitEvent(eventName, { action, source: `ControlRoutineJob id:${this.id}` });	
    }

    requiredParams(): requiredJobParamType[] {
        return [{
            name: "routineId",
            type: "string",
            validationMask: "^.+$",
            description: "ID of the routine to control",
            required: true
        },
        {
            name: "action",
            type: "string",
            validationMask: "^(enable|disable|run|stop)$",
            description: "Action to perform on the routine",
            required: true
        }];
    }

    async job(): Promise<void> {
        this.failed = false;
        // const { signal: abortSignal } = this.abortController || {};
        this.log.info(`Starting job \"${this.name}\" with ID ${this.id}`);

        try {
            let { routineId, action } = this.params;
            this.log.info(`Control routine "${routineId}" action: ${action}`);
            this.#controlRoutinesThrowEventManager(routineId, action);
            this.log.info(`Control routine "${routineId}" action "${action}" completed successfully`);
            this.dispatchEvent(jobEvents.jobFinished, { jobId: this.id, routineId, action });
        } catch (error) {
            this.failed = true;
            this.dispatchEvent(jobEvents.jobError, { jobId: this.id, error });
            throw error;
        }
    }

}

export default ControlRoutineJob;