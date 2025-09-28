import { JobInterface, JobType, requiredJobParamType } from "@common/types/job.type";
import { EventEmitter } from "events";
import { Log } from "@src/utils/log";
import crypto from "crypto";
import jobEvents from "@common/events/job.events";
import { Context } from "../context";
import dictionary from "@common/i18n";

export class Job extends EventEmitter implements JobInterface {
    id: JobInterface["id"];
    name: JobInterface["name"];
    description: JobInterface["description"];
    failed: boolean = false;
    log: Log;
    type: JobInterface["type"] = "generic"; // Default type, can be overridden in subclasses
    params: Record<string, any> = {};

    constructor(props: JobType) {
        super();

        if (props.id && typeof props.id !== 'string')
            throw new Error("Job id must be a string");
        this.id = props.id || crypto.randomUUID();

        if (props.name && typeof props.name !== 'string')
            throw new Error("Job name must be a string");
        this.name = props.name || this.id;

        if (props.description && typeof props.description !== 'string')
            throw new Error("Job description must be a string");
        this.description = props.description || "";

        if (props.params && typeof props.params !== 'object')
            throw new Error("Job params must be an object");
        this.params = props.params || {};

        this.log = Log.createInstance(`Job "${this.name}"`, true);

        this.type = props.type || "generic"; // Default type, should be overridden in subclasses

        if (this.type == "generic")
            throw new Error("Job type must be specified");

        this.log.info(`Job "${this.name}" created with ID ${this.id}`);
    }

    protected job(ctx: Context, abortSignal: AbortSignal): Promise<void> {
        throw new Error("Job method must be implemented in subclasses");
    }

    validateParams(): void {
        const requiredParams = this.requiredParams();
        for (const param of requiredParams) {
            const value = this.params[param.name];
            if (param.required && (value === undefined || value === null)) {
                throw new Error(`Missing required parameter: ${param.name}`);
            }
            if (value !== undefined && value !== null) {
                if (param.type === "number" && typeof value !== "number") {
                    throw new Error(`Parameter "${param.name}" must be a number`);
                }
                if (param.type === "string" && typeof value !== "string") {
                    throw new Error(`Parameter "${param.name}" must be a string`);
                }
                if (param.validationMask) {
                    const regex = new RegExp(param.validationMask);
                    if (!regex.test(String(value))) {
                        throw new Error(`Parameter "${param.name}" does not match validation mask: ${param.validationMask}. Current value: ${value}`);
                    }
                }
            }
        }
        this.log.info(`All parameters for job "${this.name}" are valid`);
    }

    requiredParams(): requiredJobParamType[] {
        throw new Error("Required parameters must be implemented in subclasses.");
    }

    #clearOnFinish() {
        this.removeAllListeners(jobEvents.jobFinished);
        this.removeAllListeners(jobEvents.jobError);
        this.removeAllListeners(jobEvents.jobAborted);
        this.log.info(`Cleaned up job "${this.name}" listeners and timeout`);
    }

    async execute({ abortSignal, ctx }: { abortSignal: AbortSignal, ctx: Context }): Promise<void> {

        return new Promise<void>(async (resolve, reject) => {
            const timeStart = Date.now();

            if (!abortSignal)
                throw new Error("AbortSignal is required to execute the job");

            if (!(ctx instanceof Context))
                throw new Error("ctx must be an instance of Context");

            const displayName = this.getDisplayName();
            this.log.info(ctx.log.info(dictionary("app.domain.entities.job.executed", displayName)));
            this.dispatchEvent(jobEvents.jobRunning, { jobId: this.id, jobName: this.name });

            let handleOnAbort: (() => void) | null = null;

            // Promise to handle abortion when abortSignal is triggered
            const abortPromise = new Promise<void>((_, reject) => {
                handleOnAbort = () => {
                    this.log.warn(ctx.log.warn(dictionary("app.domain.entities.job.aborted", displayName)));
                    this.dispatchEvent(jobEvents.jobAborted, { jobId: this.id });
                    reject(new Error(dictionary("app.domain.entities.job.aborted", displayName)));
                };

                abortSignal.addEventListener("abort", handleOnAbort, { once: true });
            });

            try {

                await Promise.race([
                    this.job(ctx, abortSignal),
                    abortPromise
                ]);

                this.log.info(ctx.log.info(dictionary("app.domain.entities.job.finished", (Date.now() - timeStart).toString())));
                resolve();

            } catch (error) {
                if (abortSignal.aborted) {
                    this.log.warn(ctx.log.warn(dictionary("app.domain.entities.job.abortedByUser", displayName)));
                    this.dispatchEvent(jobEvents.jobAborted, { jobId: this.id });
                    reject(new Error(dictionary("app.domain.entities.job.abortedByUser", displayName)));
                } else {
                    this.log.error(ctx.log.error(dictionary("app.domain.entities.job.failed", error?.message || "Unknown error")));
                    this.failed = true;
                    this.dispatchEvent(jobEvents.jobError, { jobId: this.id, error });
                    reject(error?.message);
                }

            } finally {
                // Clean abort listeners before leaving!
                if (handleOnAbort)
                    abortSignal.removeEventListener('abort', handleOnAbort);
                this.#clearOnFinish();
            }
        })
    }

    dispatchEvent(eventName: string, data?: any): void {
        this.emit(eventName, data);
        //this.log.info(`Event dispatched: ${eventName}`, data);
    }

    toJson(): JobType {
        return {
            id: this.id,
            name: this.name,
            description: this.description,
            params: this.params,
            type: this.type,
        };
    }

    protected getDisplayName(): string {
        return this.name || this.id;
    }
}