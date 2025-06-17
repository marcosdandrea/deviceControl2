import { JobType } from "@common/types/job.type";
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

    private eventManager: EventManager;

    constructor(options: controlRoutineInterface){
        super({
            ...options,
            timeout: 5000,
            enableTimoutWatcher: true,
            type: jobTypes.controlRoutineJob,
        });

        this.eventManager = new EventManager();
    }

    #controlRoutinesThrowEventManager(rutineId: string, action: string): void {
        const eventName = `routineId:${rutineId}`;
        this.eventManager.emitEvent(eventName, { action, source: `ControlRoutineJob id:${this.id}` });	
    }

    #getParameters(): Required<controlRoutineInterface>["params"] {
        const params = this.params || {};
        const expectedParams = ["routineId", "action"];
        const missing = expectedParams.filter(p => !(p in params))

        if (missing.length > 0) 
            throw new Error(`Missing required parameters: ${missing.join(", ")}`);
        
        if (typeof params.routineId !== "string") 
            throw new Error("routineId must be a string");
        
        if (!["enable", "disable", "run", "stop"].includes(params.action)) 
            throw new Error("action must be one of: enable, disable, run, stop");
        
        return params as Required<controlRoutineInterface>["params"];
    }

    async job(): Promise<void> {
        this.failed = false;
        // const { signal: abortSignal } = this.abortController || {};
        this.log.info(`Starting job \"${this.name}\" with ID ${this.id}`);

        try {
            let { routineId, action } = this.#getParameters();
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