import { JobType, requiredJobParamType } from "@common/types/job.type";
import { Job } from "../..";
import jobEvents from "@common/events/job.events";
import { jobTypes } from "..";
import { Context } from "@src/domain/entities/context";
import dictionary from "@common/i18n";

export class WaitJob extends Job {
    static description = "Waits for a specified amount of time before completing.";
    static name = "Esperar";
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
            const displayName = this.getDisplayName();

            if (ctx == null)
                return reject(new Error(dictionary("app.domain.entities.job.contextRequired", displayName)));

            if (abortSignal == null)
               return reject(new Error(dictionary("app.domain.entities.job.abortSignalRequired", displayName)));

            const { time } = this.params;
            //const displayName = this.name || this.id;
            if (typeof time !== "number" || time < 0 || time > 2147483647) {
                ctx.log.error(dictionary("app.domain.entities.job.wait.invalidTimeParameter", displayName, time));
                this.failed = true;
                this.dispatchEvent(jobEvents.jobError, { jobId: this.id, error: "Invalid time parameter" });
                return reject(new Error(dictionary("app.domain.entities.job.wait.invalidTimeParameter", displayName, time)));
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
                ctx.log.warn(dictionary("app.domain.entities.job.wait.aborted", displayName));
                this.dispatchEvent(jobEvents.jobAborted, { jobId: this.id });
                reject(new Error(dictionary("app.domain.entities.job.aborted", displayName)));
            };

            abortSignal.addEventListener("abort", abortListener);

            this.timeoutTimer = setTimeout(() => {
                cleanup();
                ctx.log.info(dictionary("app.domain.entities.job.wait.completed", displayName));
                this.dispatchEvent(jobEvents.jobFinished, { jobId: this.id });
                resolve();
            }, time);

            this.timeoutTimer.unref?.();
        });
    }
}

export default WaitJob;