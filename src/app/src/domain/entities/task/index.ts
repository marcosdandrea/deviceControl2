import { description, id, name, RunCtx } from "@common/types/commons.type";
import { ConditionInterface } from "@common/types/condition.type";
import { JobInterface, JobType } from "@common/types/job.type";
import { TaskInterface, TaskType } from "@common/types/task.type";
import { Log } from "@src/utils/log";
import crypto from "crypto";
import { EventEmitter } from "events";
import taskEvents from "@common/events/task.events";

export class Task extends EventEmitter implements TaskInterface {
    id: id;
    name: name;
    description: description;
    job: JobInterface | null;
    condition: ConditionInterface | null;
    retries: number = 1;
    waitBeforeRetry: number = 100;
    totalRetries: number = 0;
    continueOnError: boolean;
    checkConditionBeforeExecution: boolean;
    failed: boolean;
    aborted: boolean;

    log: Log;
    startTime: number | null = null;

    constructor(props: TaskType) {
        super();

        if (props?.id && typeof props.id !== 'string')
            throw new Error("Task id must be a string");
        this.id = props.id || crypto.randomUUID();

        if (props?.name && typeof props.name !== 'string')
            throw new Error("Task name must be a string");
        this.name = props.name;

        this.description = props?.description || "";

        this.job = null;
        this.condition = null;
        this.failed = false;
        this.aborted = false;

        this.checkConditionBeforeExecution = props?.checkConditionBeforeExecution ?? true;

        if (props?.continueOnError && typeof props.continueOnError !== 'boolean')
            throw new Error("continueOnError must be a boolean");
        this.continueOnError = props?.continueOnError ?? true;

        this.log = new Log(`Task "${this.name}"`, false);

        if (props?.retries && Number(props.retries) < 1)
            throw new Error("retries must be a positive number greater than one");
        this.retries = props.retries || 1;

        if (props?.waitBeforeRetry && Number(props.waitBeforeRetry) < 0)
            throw new Error("waitBeforeRetry must be a positive number or zero");
        this.waitBeforeRetry = props.waitBeforeRetry || 100;

        this.log.info(`Task "${this.name}" created with ID "${this.id}"`);
    }

    setJob(job: JobInterface): void {
        if (!job || typeof job !== 'object' || !job.execute || typeof job.execute !== 'function') {
            throw new Error("Invalid job provided to Task");
        }
        this.job = job;
        this.log.info(`Job set for task ${this.name}`);
    }

    setCondition(condition: ConditionInterface | null): void {
        if (condition && (typeof condition !== 'object' || !condition.evaluate || typeof condition.evaluate !== 'function')) {
            throw new Error("Invalid condition provided to Task");
        }
        this.condition = condition;
        this.log.info(`Condition set for task ${this.name}`);
    }

    setRetries(retries: number): void {
        if (typeof retries !== 'number' || retries < 0)
            throw new Error("Retries must be a non-negative number");

        this.retries = retries;
        this.log.info(`Retries set to ${this.retries} for task ${this.name}`);
    }

    setWaitBeforeRetry(waitBeforeRetry: number): void {
        if (typeof waitBeforeRetry !== 'number' || waitBeforeRetry < 0)
            throw new Error("waitBeforeRetry must be a non-negative number");

        this.waitBeforeRetry = waitBeforeRetry;
        this.log.info(`Wait before retry set to ${this.waitBeforeRetry}ms for task ${this.name}`);
    }

    setContinueOnError(continueOnError: boolean): void {
        if (typeof continueOnError !== 'boolean')
            throw new Error("continueOnError must be a boolean");

        this.continueOnError = continueOnError;
        this.log.info(`Continue on error set to ${this.continueOnError} for task ${this.name}`);
    };


    /**
     * 
     * @param abortSignal // Signal to abort the task execution
     * @param runCtx // Context of the routine running the task
     * @returns 
     */
    async run({ abortSignal, runCtx }: { abortSignal: AbortSignal, runCtx: RunCtx }): Promise<void> {
        this.startTime = Date.now();

        const ctx = { 
            ...runCtx,
            hierarchy: [...(runCtx.hierarchy ?? []), {type: 'task', name: this.name}]
        };

        ctx.baseLogger.info(`Starting task "${this.name}" (ID: ${this.id})`, ctx);
        this.#dispatchEvent(taskEvents.taskRunning, { taskId: this.id, taskName: this.name });

        this.totalRetries = 0;
        this.failed = false;
        this.aborted = false;

        if (!this.job || typeof this.job.execute !== 'function')
            throw new Error(`No valid job set for task "${this.name}"`);

        const checkAbort = () => {
            if (!abortSignal?.aborted) return
            this.aborted = true;
            throw new Error(`Task "${this.name}" aborted`);
        }

        const onTaskCompleted = () => {
            this.failed = false;
            const duration = Date.now() - (this.startTime ?? Date.now());
            ctx.baseLogger.info(`Task "${this.name}" completed successfully in ${duration}ms`, null, ctx);
            this.#dispatchEvent(taskEvents.taskCompleted, { taskId: this.id, taskName: this.name, failed: false, duration });
        }

        const checkCondition = async () => {

            if (await this.condition!.evaluate({ abortSignal, runCtx: ctx })) {
                ctx.baseLogger.info(`Condition met for task ${this.name}, finishing task execution.`, null, ctx);
                onTaskCompleted();
                return true
            }

            return false
        };

        while (this.totalRetries < this.retries) {

            try {

                checkAbort();

                if (this.condition) {
                    if (this.checkConditionBeforeExecution) {
                        ctx.baseLogger.info(`Checking condition before executing task ${this.name}.`, null, ctx);
                        if (await checkCondition())
                            return Promise.resolve();
                    }
                }

                await this.job.execute({ abortSignal, runCtx: ctx });

                if (!this.condition) {
                    ctx.baseLogger.info(`No condition set for task ${this.name}, finishing task execution.`, null, ctx);
                    onTaskCompleted();
                    return Promise.resolve();
                }

                if (await checkCondition())
                    return Promise.resolve();

                ctx.baseLogger.info(`Condition not met, will retry.`, null, ctx);

            } catch (error) {

                if (this.aborted) {
                    ctx.baseLogger.info(`Task ${this.name} aborted, not continuing.`, null, ctx);
                    this.#dispatchEvent(taskEvents.taskAborted, { taskId: this.id, taskName: this.name });
                    throw error
                }

                ctx.baseLogger.info(`Error in task ${this.name}: ${error instanceof Error ? error.message : String(error)}`, null, ctx);
                this.#dispatchEvent(taskEvents.taskError, { taskId: this.id, taskName: this.name, error });

                if (!this.continueOnError) {
                    ctx.baseLogger.info(`Task ${this.name} failed and will not continue due to continueOnError being false.`, null, ctx);
                    this.#dispatchEvent(taskEvents.taskFailed, { taskId: this.id, taskName: this.name, error });
                    return Promise.reject(`Task ${this.name} failed and will not continue due to continueOnError being false.`);
                }

            }

            this.totalRetries++;

            if (this.totalRetries >= this.retries) {
                ctx.baseLogger.info(`Max retries reached for task ${this.name}.`, null, ctx);
                this.#dispatchEvent(taskEvents.taskFailed, { taskId: this.id, taskName: this.name, error: new Error(`Max retries reached for task ${this.name}`) });
                this.failed = true;
                return Promise.reject(`Max retries reached for task ${this.name}`);
            }

            ctx.baseLogger.info(`Retrying task ${this.name} in ${this.waitBeforeRetry}ms.`, null, ctx);

            await new Promise((resolve, reject) => {
                const timeout = setTimeout(() => {
                    abortSignal.removeEventListener('abort', onAbort);
                    return resolve(undefined);
                }, this.waitBeforeRetry);

                const onAbort = () => {
                    clearTimeout(timeout);
                    abortSignal.removeEventListener('abort', onAbort);
                    reject(new Error(`Task ${this.name} aborted during retry wait`));
                };

                if (abortSignal) {
                    abortSignal.addEventListener('abort', onAbort);
                }
            });

            this.#dispatchEvent(taskEvents.taskRetrying, { taskId: this.id, taskName: this.name, attempt: this.totalRetries });
        }
    }

    #dispatchEvent(eventName: string, ...args: any[]) {
        this.emit(eventName, ...args);
        this.log.info(`Event dispatched: ${eventName}`, ...args);
    }

    toJson(): TaskType {
        return {
            id: this.id,
            name: this.name,
            description: this.description,
            job: this.job.toJson(),
            condition: this.condition ? this.condition.toJson() : null,
            retries: this.retries,
            waitBeforeRetry: this.waitBeforeRetry,
            continueOnError: this.continueOnError
        };
    }



}