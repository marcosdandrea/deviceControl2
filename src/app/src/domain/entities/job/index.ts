import { JobInterface, JobType } from "@common/types/job.type";
import { EventEmitter } from "events";
import { Log } from "@src/utils/log";
import crypto from "crypto";
import jobEvents from "@common/events/job.events";
import { RunCtx } from "@common/types/commons.type";
import { c } from "node_modules/vite/dist/node/types.d-aGj9QkWt";
import { Context } from "../context";

export class Job extends EventEmitter implements JobInterface {
    id: JobInterface["id"];
    name: JobInterface["name"];
    description: JobInterface["description"];
    timeout: JobInterface["timeout"];
    failed: boolean = false;
    log: Log;
    enableTimoutWatcher: boolean = true;
    timeoutTimer: NodeJS.Timeout | null = null;
    abortController: AbortController | null = null;
    type: JobInterface["type"] = "generic"; // Default type, can be overridden in subclasses
    params: Record<string, any> = {};
    #handleOnAbortTimeout: (() => void) | null = null;

    constructor(props: JobType) {
        super();

        if (props.id && typeof props.id !== 'string')
            throw new Error("Job id must be a string");
        this.id = props.id || crypto.randomUUID();

        if (props.name && typeof props.name !== 'string')
            throw new Error("Job name must be a string");
        this.name = props.name;

        if (props.description && typeof props.description !== 'string')
            throw new Error("Job description must be a string");
        this.description = props.description || "";

        if (props.timeout && (typeof props.timeout !== 'number') || props.timeout <= 0)
            throw new Error("Job timeout must be a number greater than zero");
        this.timeout = props.timeout || 5000; // Default to 5000ms if not specified

        if (props.params && typeof props.params !== 'object')
            throw new Error("Job params must be an object");
        this.params = props.params || {};

        this.log = new Log(`Job "${this.name}"`, false);

        this.enableTimoutWatcher = props?.enableTimoutWatcher ?? false;

        this.type = props.type || "generic"; // Default type, should be overridden in subclasses

        if (this.type == "generic")
            throw new Error("Job type must be specified");

        this.log.info(`Job "${this.name}" created with ID ${this.id}`);
    }


    protected job(ctx: Context): Promise<void> {
        throw new Error("Job method must be implemented in subclasses");
    }


    #timeoutWatcher({ abortSignal }: { abortSignal: AbortSignal }): Promise<void> {

        return new Promise<void>((resolve, reject) => {

            const cleanUp = () => {
                if (this.timeoutTimer) {
                    clearTimeout(this.timeoutTimer);
                    this.timeoutTimer = null;
                }
                this.removeAllListeners(jobEvents.jobFinished);
                this.removeAllListeners(jobEvents.jobError);
                this.removeAllListeners(jobEvents.jobAborted);
                if (abortSignal && this.#handleOnAbortTimeout) {
                    abortSignal.removeEventListener('abort', this.#handleOnAbortTimeout);
                }
                this.log.info(`Cleaned up job "${this.name}" listeners and timeout`);
            }

            if (!this.enableTimoutWatcher) {
                this.timeoutTimer = null;
            } else {
                this.timeoutTimer = setTimeout(() => {
                    this.dispatchEvent(jobEvents.jobTimeout, { jobId: this.id });
                    this.abortController?.abort();
                    reject(new Error(`Job "${this.name}" timed out after ${this.timeout} ms`));
                    cleanUp();
                }, this.timeout);
            }


            // Resolve the promise if the job completes before timeout
            this.once(jobEvents.jobFinished, () => {
                cleanUp();
                resolve();
                this.log.info(`Job "${this.name}" completed successfully`);
            });

            // Handle job failure
            this.once(jobEvents.jobError, (error: Error) => {
                cleanUp();
                this.log.error(`Job "${this.name}" failed: ${error.message}`);
            });

            this.#handleOnAbortTimeout = () => {
                cleanUp();
                this.log.warn(`Job "${this.name}" was aborted`);
                this.dispatchEvent(jobEvents.jobAborted, { jobId: this.id });
                reject(new Error(`Job "${this.name}" was aborted`));
                this.#handleOnAbortTimeout = null;
            }

            // Handle job cancellation
            if (abortSignal) {
                abortSignal.addEventListener('abort', this.#handleOnAbortTimeout);
            }
        });
    }

    async execute({ abortSignal, ctx }: { abortSignal: AbortSignal, ctx: Context }): Promise<void> {

        if (!abortSignal)
            throw new Error("AbortSignal is required to execute the job");

        if (!(ctx instanceof Context))
            throw new Error("ctx must be an instance of Context");

        ctx.log.info(`Executing job`);
        this.dispatchEvent(jobEvents.jobRunning, { jobId: this.id, jobName: this.name });
        this.abortController = new AbortController()

        const handleOnAbort = () => {
            ctx.log.info(`Job execution was aborted`);
            this.dispatchEvent(jobEvents.jobAborted, { jobId: this.id });
            this.abortController?.abort();
            return Promise.reject(`Job "${this.name}" was aborted`);
        }


        if (abortSignal.aborted) {
            this.abortController?.abort();
            return Promise.reject(new Error(`Job aborted before execution`))
        }

        // Promise to handle abortion via abortSignal
        const abortPromise = new Promise<void>((_, reject) => {
            abortSignal.addEventListener("abort", handleOnAbort, { once: true });
        });

        try {
            await Promise.race([
                this.#timeoutWatcher({ abortSignal }),
                this.job(ctx),
                abortPromise
            ]);

            abortSignal.removeEventListener('abort', handleOnAbort);
            ctx.log.info(`Execution finished successfully`);
            return Promise.resolve();
        } catch (error) {
            this.failed = true;
            ctx.log.error(`Execution failed: ${error instanceof Error ? error.message : String(error)}`);
            // Clean abort listeners before leaving!
            abortSignal.removeEventListener('abort', handleOnAbort);
            abortSignal.removeEventListener('abort', this.#handleOnAbortTimeout as EventListener);
            throw error;
        }
    }

    dispatchEvent(eventName: string, data?: any): void {
        this.emit(eventName, data);
        this.log.info(`Event dispatched: ${eventName}`, data);
    }

    toJson(): JobType {
        return {
            id: this.id,
            name: this.name,
            description: this.description,
            timeout: this.timeout,
            params: this.params,
            type: this.type,
        };
    }
}