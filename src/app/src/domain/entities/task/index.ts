import { description, id, name, RunCtx } from "@common/types/commons.type";
import { ConditionInterface } from "@common/types/condition.type";
import { JobInterface, JobType } from "@common/types/job.type";
import { TaskInterface, TaskType } from "@common/types/task.type";
import { Log } from "@src/utils/log";
import crypto from "crypto";
import { EventEmitter } from "events";
import taskEvents from "@common/events/task.events";
import { Context } from "../context";
import { TimeoutController } from "../../../controllers/Timeout";

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
    timeout?: number;
    timeoutController: TimeoutController;

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

        this.log = Log.createInstance(`Task "${this.name}"`, true);

        if (props?.retries && Number(props.retries) < 1)
            throw new Error("retries must be a positive number greater than one");
        this.retries = props.retries || 1;

        if (props?.waitBeforeRetry && Number(props.waitBeforeRetry) < 0)
            throw new Error("waitBeforeRetry must be a positive number or zero");
        this.waitBeforeRetry = props.waitBeforeRetry || 100;

        if (!props.timeout || Number(props.timeout) < 0)
            throw new Error("Task timeout must be a positive number or zero");

        this.timeout = props.timeout;
        this.timeoutController = new TimeoutController(Number(props.timeout));

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
    async run({ abortSignal, runCtx }: { abortSignal: AbortSignal, runCtx: Context }): Promise<void> {
        return new Promise<void>(async (resolve, reject) => {
            this.startTime = Date.now();

            const ctxNode = {
                type: 'task',
                id: this.id,
                name: this.name
            };
            const childCtx = runCtx.createChildContext(ctxNode);
            childCtx.log.info(`Starting task "${this.name}" (ID: ${this.id})`);

            this.#dispatchEvent(taskEvents.taskRunning, { taskId: this.id, taskName: this.name });

            const abortJobsAndConditionsController = new AbortController();

            const onAbort = () => {
                this.aborted = true;
                abortJobsAndConditionsController.abort();
            };

            abortSignal.addEventListener("abort", onAbort, { once: true });
            
            try {
                this.failed = false;
                await Promise.race([
                    this.jobsAndConditions({ abortSignal: abortJobsAndConditionsController.signal, childCtx }),
                    this.timeoutController.start(abortSignal)
                ]);
                childCtx.log.info(`Task "${this.name}" completed successfully`);
                this.#dispatchEvent(taskEvents.taskCompleted, { taskId: this.id, taskName: this.name, duration: Date.now() - (this.startTime ?? Date.now()) });
                resolve();
            } catch (error) {
                if (abortSignal.aborted) {
                    this.aborted = true;
                    this.timeoutController.clear();
                    childCtx.log.info(`Task ${this.name} aborted.`);
                    this.#dispatchEvent(taskEvents.taskAborted, { taskId: this.id, taskName: this.name });
                    reject(`Task "${this.name}" aborted`);
                } else if (this.timeoutController.timedout) {
                    childCtx.log.error(`Task ${this.name} timed out.`)
                    abortJobsAndConditionsController.abort();
                    this.failed = true;
                    this.#dispatchEvent(taskEvents.taskFailed, { taskId: this.id, taskName: this.name, error });
                    reject(`Task ${this.name} timed out.`);
                } else {
                    this.failed = true;
                    this.#dispatchEvent(taskEvents.taskFailed, { taskId: this.id, taskName: this.name, error });
                    childCtx.log.error(`Task ${this.name} failed: ${error instanceof Error ? error.message : String(error)}`);
                    reject(error);
                } 
            } finally {
                this.timeoutController.clear();
            }
        })
    }


    async jobsAndConditions({ abortSignal, childCtx }: { abortSignal: AbortSignal, childCtx: Context }): Promise<void> {

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
            childCtx.log.info(`Task "${this.name}" completed successfully in ${duration}ms`);
        }

        const checkCondition = async (): Promise<boolean> => {

            try {
                await this.condition!.evaluate({ abortSignal, ctx: childCtx })
                childCtx.log.info(`Condition met for task ${this.name}, finishing task execution.`);
                onTaskCompleted();
                return true
            } catch (error) {
                this.log.warn(`Condition not met for task ${this.name}`);
                return false
            }

        };


        while (this.totalRetries < this.retries) {
            try {
                checkAbort();

                // Si hay condición y se debe chequear antes de ejecutar el job
                if (this.condition && this.checkConditionBeforeExecution) {
                    this.log.info(childCtx.log.info(`Checking condition before executing task ${this.name}.`));
                    const conditionMet = await checkCondition();
                    this.log.info(`Condition before execution for task ${this.name} evaluated to ${conditionMet}`);
                    if (conditionMet) {
                        // Solo termina si la condición indica que no es necesario ejecutar el job
                        return Promise.resolve();
                    }
                }

                this.log.info(childCtx.log.info(`Executing job for task ${this.name}, attempt ${this.totalRetries + 1} of ${this.retries}.`));
                await this.job.execute({ abortSignal, ctx: childCtx });

                // Si no hay condición, termina después de ejecutar el job
                if (!this.condition) {
                    this.log.info(childCtx.log.info(`No condition set for task ${this.name}, finishing task execution.`))
                    onTaskCompleted();
                    return Promise.resolve();
                }

                // Si hay condición, evalúa después de ejecutar el job
                const conditionMetAfterJob = await checkCondition();
                if (conditionMetAfterJob) {
                    return Promise.resolve();
                }

                this.log.info(childCtx.log.info(`Condition not met after job execution, will retry.`));

            } catch (error) {

                if (this.aborted) {
                    this.timeoutController.clear();
                    this.log.info(childCtx.log.info(`Task ${this.name} aborted, not continuing.`));
                    throw error
                }

                this.log.error(childCtx.log.info(`Error in task ${this.name}: ${error instanceof Error ? error.message : String(error)}`), error);

                if (!this.continueOnError) {
                    this.timeoutController.clear();
                    this.log.info(childCtx.log.info(`Task ${this.name} failed and will not continue due to continueOnError being false.`));
                    return Promise.reject(`Task ${this.name} failed and will not continue due to continueOnError being false.`);
                }

            }

            this.totalRetries++;

            if (this.totalRetries >= this.retries) {
                this.timeoutController.clear();
                this.log.info(childCtx.log.info(`Max retries reached for task ${this.name}.`));
                this.failed = true;
                return Promise.reject(`Max retries reached for task ${this.name}`);
            }

            this.log.info(childCtx.log.info(`Retrying task ${this.name} in ${this.waitBeforeRetry}ms.`));

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

            this.#dispatchEvent(taskEvents.taskRetrying, { taskId: this.id, taskName: this.name, attempt: this.retries, totalRetries: this.totalRetries });
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
            timeout: this.timeout,
            waitBeforeRetry: this.waitBeforeRetry,
            continueOnError: this.continueOnError
        };
    }



}