import { JobType, requiredJobParamType } from "@common/types/job.type";
import { Job } from "../..";
import jobEvents from "@common/events/job.events";
import { jobTypes } from "..";
import { Context } from "@src/domain/entities/context";

export class WaitJob extends Job {
    static description = "Waits for a specified amount of time before completing.";
    static name = "Wait Job";
    static type = jobTypes.waitJob;
    private timeoutTimer: NodeJS.Timeout | null = null;

    constructor(options: JobType) {
        super({
            ...options,
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

    async job(ctx: Context, abortSignal: AbortSignal): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            if (ctx == null)
                return reject(new Error("Context is required for job execution"));

            if (abortSignal == null)
               return reject(new Error("AbortSignal is required for job execution"));

            const { time } = this.params;
            if (typeof time !== "number" || time < 0 || time > 2147483647) {
                ctx.log.error(`Invalid 'time' parameter for job "${this.name}": ${time}`);
                this.failed = true;
                this.dispatchEvent(jobEvents.jobError, { jobId: this.id, error: "Invalid time parameter" });
                return reject(new Error("Invalid time parameter. Must be between 0 and 2147483647."));
            }

            this.failed = false;
            this.dispatchEvent(jobEvents.jobRunning, { jobId: this.id });

            const clearTimeoutTimer = () => {
                if (this.timeoutTimer)
                    clearTimeout(this.timeoutTimer);
            };

            let abortListener: (() => void) | null = null;

            const cleanup = () => {
                if (abortListener)
                    abortSignal.removeEventListener("abort", abortListener);
                clearTimeoutTimer();
            };

            abortListener = () => {
                cleanup();
                ctx.log.warn(`Job "${this.name}" was aborted`);
                this.dispatchEvent(jobEvents.jobAborted, { jobId: this.id });
                reject(new Error("Job aborted"));
            };

            abortSignal.addEventListener("abort", abortListener);

            this.timeoutTimer = setTimeout(() => {
                cleanup();
                ctx.log.info(`Job "${this.name}" completed successfully`);
                this.dispatchEvent(jobEvents.jobFinished, { jobId: this.id });
                resolve();
            }, time);

            this.timeoutTimer.unref?.();
        });
    }
}

export default WaitJob;