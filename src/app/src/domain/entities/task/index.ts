import { description, id, name } from "@common/types/commons.type";
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

        this.checkConditionBeforeExecution = props?.checkConditionBeforeExecution || true;

        if (props?.continueOnError && typeof props.continueOnError !== 'boolean')
            throw new Error("continueOnError must be a boolean");
        this.continueOnError = props.continueOnError || true;

        this.log = new Log(`Task "${this.name}"`, true);

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
    }


    async run({ abortSignal }: { abortSignal: AbortSignal }): Promise<void> {
        this.startTime = Date.now();
        this.log.info(`Running task "${this.name}" with ID "${this.id}"`);
        this.#dispatchEvent(taskEvents.taskRunning, this.id, this.name);

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
            const duration = Date.now() - this.startTime;
            this.log.info(`Task "${this.name}" completed successfully ${duration}ms`);
            this.#dispatchEvent(taskEvents.taskCompleted, { taskId: this.id, taskName: this.name, failed: false });
        }

        const checkCondition = async () => {
            if (!this.condition) {
                this.log.info(`No condition set for task "${this.name}". Exiting task.`);
                onTaskCompleted();
                return true
            }

            if (await this.condition.evaluate({ abortSignal })) {
                this.log.info(`Condition met for task ${this.name}, finishing task execution.`);
                onTaskCompleted();
                return true
            }

            return false
        };

        while (this.totalRetries < this.retries) {

            try {

                checkAbort();

                if (this.checkConditionBeforeExecution) {
                    this.log.info(`Checking condition before executing task ${this.name}.`);
                    if (await checkCondition())
                        return Promise.resolve();
                }

                await this.job.execute({ abortSignal });

                if (await checkCondition())
                    return Promise.resolve();

                this.log.info(`Condition not met, will retry.`);

            } catch (error) {

                if (this.aborted) {
                    this.log.warn(`Task ${this.name} aborted, not continuing.`);
                    this.#dispatchEvent(taskEvents.taskAborted, { taskId: this.id, taskName: this.name });
                    throw error
                }

                this.log.error(`Error in task ${this.name}:`, error);
                this.#dispatchEvent(taskEvents.taskError, { taskId: this.id, taskName: this.name, error });

                if (!this.continueOnError) {
                    this.log.error(`Task ${this.name} failed and will not continue due to continueOnError being false.`);
                    this.#dispatchEvent(taskEvents.taskFailed, { taskId: this.id, taskName: this.name, error });
                    return Promise.reject(`Task ${this.name} failed and will not continue due to continueOnError being false.`);
                }

            }

            this.totalRetries++;

            if (this.totalRetries >= this.retries) {
                this.log.info(`Max retries reached for task ${this.name}.`);
                this.#dispatchEvent(taskEvents.taskFailed, this.id, this.name, new Error(`Max retries reached for task ${this.name}`));
                this.failed = true;
                return Promise.reject(`Max retries reached for task ${this.name}`);
            }

            this.log.info(`Retrying task ${this.name} in ${this.waitBeforeRetry}ms.`);

            await new Promise((resolve, reject) => {
                const timeout = setTimeout(resolve, this.waitBeforeRetry);
                if (abortSignal) {
                    const onAbort = () => {
                        clearTimeout(timeout);
                        abortSignal.removeEventListener('abort', onAbort);
                        reject(new Error(`Task ${this.name} aborted during retry wait`));
                    };
                    abortSignal.addEventListener('abort', onAbort);
                }
            });

            this.#dispatchEvent(taskEvents.taskRetrying, this.id, this.name, this.totalRetries);
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