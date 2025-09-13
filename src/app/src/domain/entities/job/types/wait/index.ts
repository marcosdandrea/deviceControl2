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

        let abortListener: (() => void) | null = null;

        try {
            let { time } = this.params;

            await new Promise<void>((resolve, reject) => {
                if (this.timeoutTimer)
                    clearTimeout(this.timeoutTimer);

                abortListener = () => {
                    clearTimeoutTimer();
                    reject(new Error(`Job "${this.name}" was aborted`));
                };

                abortSignal?.addEventListener("abort", abortListener, { once: true });

                this.timeoutTimer = setTimeout(() => {
                    ctx.log.info(`Job "${this.name}" completed successfully`);
                    this.dispatchEvent(jobEvents.jobFinished, { jobId: this.id });
                    resolve();
                }, time);
            });
        } catch (error) {
            if ((error as Error).message.includes('was aborted')) {
                this.log.warn((error as Error).message);
            } else {
                ctx.log.error(`Error in job "${this.name}": ${(error as Error).message}`);
                this.failed = true;
                this.dispatchEvent(jobEvents.jobError, { jobId: this.id, error });
            }
            return Promise.reject(error);
        } finally {
            if (abortListener)
                abortSignal?.removeEventListener("abort", abortListener);
        }
    }

}

export default WaitJob;