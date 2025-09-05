import { JobType, requiredJobParamType } from "@common/types/job.type";
import { Job } from "../..";
import jobEvents from "@common/events/job.events";
import { jobTypes } from "..";
import { Context } from "@src/domain/entities/context";


export class WaitJob extends Job {
    static description = "Waits for a specified amount of time before completing.";
    static name = "Wait Job";
    static type = jobTypes.waitJob;

    constructor(options: JobType) {
        super({
            ...options,
            timeout: 5000,
            enableTimoutWatcher: false, // WaitJob does not use timeout watcher
            type: jobTypes.waitJob
        });

        this.validateParams();        
    }

    requiredParams(): requiredJobParamType[] {
        return [{
            name: "time",
            type: "number",
            validationMask: "^(\\d+)$",
            description: "Time to wait in milliseconds (0-2147483647)",
            required: true
        }];
    }

    async job(ctx: Context): Promise<void> {
        this.failed = false;
        const { signal: abortSignal } = this.abortController || {};
        this.dispatchEvent(jobEvents.jobRunning, { jobId: this.id });
        ctx.log.info(`Starting job "${this.name}"`);

        const clearTimeoutTimer = () => {
            if (this.timeoutTimer) 
                clearTimeout(this.timeoutTimer);
        }

        const handleOnAbort = () => {
            clearTimeoutTimer();
        }

        const cleanUpAbortListener = () => {
            abortSignal?.removeEventListener("abort", handleOnAbort);
        }
 
        try {

            let { time } = this.params

            if (abortSignal?.aborted) {
                this.dispatchEvent(jobEvents.jobAborted, { jobId: this.id });
                return Promise.reject(new Error(`Job "${this.name}" was aborted before execution`));
            }

            abortSignal?.addEventListener("abort", handleOnAbort, { once: true });

            await new Promise<void>((resolve) => {
                if (this.timeoutTimer)
                    clearTimeout(this.timeoutTimer);

                this.timeoutTimer = setTimeout(() => {
                    ctx.log.info(`Job "${this.name}" completed successfully`);
                    this.dispatchEvent(jobEvents.jobFinished, { jobId: this.id });
                    
                    resolve();
                }, time);
            });
            Promise.resolve();            
        } catch (error) {
            ctx.log.error(`Error in job "${this.name}": ${error.message}`);
            this.failed = true;
            this.dispatchEvent(jobEvents.jobError, { jobId: this.id, error });

            Promise.reject(error);
        } finally {
            cleanUpAbortListener();
        }
    }

}

export default WaitJob;