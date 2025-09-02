import { JobType } from "@common/types/job.type";
import { Job } from "../..";
import jobEvents from "@common/events/job.events";
import { jobTypes } from "..";
import { RunCtx } from "@common/types/commons.type";
import { run } from "node:test";
import { Context } from "@src/domain/entities/context";


export class WaitJob extends Job {

    constructor(options: JobType) {
        super({
            ...options,
            timeout: 5000,
            enableTimoutWatcher: false, // WaitJob does not use timeout watcher
            type: jobTypes.waitJob
        });

        
    }

    #getParameters(): Record<string, any> {

        const params = this.params || {};

        const expectedParams = ["time"];
        const missingParams = expectedParams.filter(param => !(param in params));

        if (missingParams.length > 0)
            throw new Error(`Missing required parameters: ${missingParams.join(", ")}`);

        if (typeof params.time !== 'number')
            throw new Error("time must be a number");

        if (Number(params.time) < 0 || Number(params.time) > 2147483647)
            throw new Error("time must be a number between 0 and 2147483647");

        return params as Record<string, any>;
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

            let { time } = this.#getParameters();

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