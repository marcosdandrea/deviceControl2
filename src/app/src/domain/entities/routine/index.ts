/**
 * @description "Create a routine to execute tasks in a specific order and with triggers"
 * @author "Marcos D'Andrea"
 * @date "21-05-2025"
 * @version "1.0.0"
 */

import routineEvents from "@common/events/routine.events";
import triggerEvents from "@common/events/trigger.events";
import { id } from "@common/types/commons.type";
import { RoutineInterface, RoutineType } from "@common/types/routine.type";
import { TaskInterface } from "@common/types/task.type";
import { TriggerInterface } from "@common/types/trigger.type";
import { Log } from "@src/utils/log";
import { EventEmitter } from "events";
import crypto from "crypto";

export class Routine extends EventEmitter implements RoutineInterface {

    id: RoutineType["id"];
    name: RoutineType["name"];
    description: RoutineType["description"];
    enabled: RoutineType["enabled"];
    runInSync: RoutineType["runInSync"];
    continueOnError: RoutineType["continueOnError"];
    isRunning: RoutineInterface["isRunning"];
    taskTimeout: number | false;
    
    private tasks: TaskInterface[] = [];
    private triggers: TriggerInterface[] = [];

    logger: Log;
    abortController: AbortController | null;
    timeoutController: AbortController | null;

    constructor(props: RoutineType) {
        super();
        this.id = props.id || crypto.randomUUID();
        this.name = props.name;
        this.description = props.description;
        this.enabled = props.enabled || true;
        this.runInSync = props.runInSync || false;
        this.continueOnError = props.continueOnError || true;
        this.triggers = [];
        this.isRunning = false;
        this.taskTimeout = props.taskTimeout || 10000;

        this.logger = new Log(`Routine "${this.name}"`, true);
        this.abortController = null
    }

    /**
     * 
     * @param runInSync - If true, tasks will be executed in sync mode, one after another.
     * If false, tasks will be executed in parallel.
     */

    setExecutionModeInSync(runInSync: boolean): void {
        if (typeof runInSync !== 'boolean')
            throw new Error("Execution mode must be a boolean");

        this.runInSync = runInSync;
        this.logger.info(`Run in sync mode set to ${runInSync}`);
        this.#eventDispatcher(routineEvents.routineExecutionModeChanged, runInSync);
    }

    addTask(task: TaskInterface): void {
        this.tasks.push(task);
        this.logger.info(`Task ${task.name} added`);
        this.#eventDispatcher(routineEvents.routineTaskAdded, task.id);
    }

    removeTask(taskId: id): void {
        const task = this.tasks.find(t => t.id === taskId);
        if (!task)
            throw new Error(`Task with id ${taskId} not found`);

        this.tasks = this.tasks.filter(t => t.id !== taskId);
        this.#eventDispatcher(routineEvents.routineTaskRemoved, taskId);

    }

    removeAllTasks(): void {
        this.tasks.forEach(task => {
            this.#eventDispatcher(routineEvents.routineTaskRemoved, task.id);
        });
        this.tasks = [];
        this.logger.info("All tasks removed from routine");
    }

    getTasks(): TaskInterface[] {
        return [...this.tasks]
    }

    swapTaskOrder(taskId: id, newIndex: number): void {
        if (newIndex < 0 || newIndex >= this.tasks.length)
            throw new Error(`Index out of bounds: ${newIndex}`);

        const taskIndex = this.tasks.findIndex(t => t.id === taskId);

        if (taskIndex === -1)
            throw new Error(`Task with id ${taskId} not found`);

        if (taskIndex === newIndex)
            return;

        const taskToSwap = this.tasks[newIndex]
        const taskToMove = this.tasks[taskIndex];

        this.tasks[newIndex] = taskToMove;
        this.tasks[taskIndex] = taskToSwap;

        this.logger.info(`Task ${taskToMove.name} moved from index ${taskIndex} to ${newIndex}`);
        this.#eventDispatcher(routineEvents.routineTaskOrderChanged, taskToMove.id, newIndex);
    }

    #onTriggerExecute(trigger: TriggerInterface): void {
        this.logger.info(`Trigger ${trigger.name} executed`);
        this.#eventDispatcher(routineEvents.routineTriggerTriggered, trigger.id);
        this.run();
    }

    #bindTriggerEvents(trigger: TriggerInterface): void {
        trigger.on(triggerEvents.triggerTriggered, this.#onTriggerExecute.bind(this, trigger));
        this.logger.info(`Trigger "${trigger.name}" bound`);
    }

    #unbindTriggerEvents(trigger: TriggerInterface): void {
        trigger.off(triggerEvents.triggerTriggered, this.#onTriggerExecute.bind(this, trigger));
        this.logger.info(`Trigger "${trigger.name}" unbound`);
    }

    addTrigger(trigger: TriggerInterface): void {
        if (this.triggers.find(t => t.id === trigger.id))
            throw new Error(`Trigger with id ${trigger.id} already exists`);

        this.#bindTriggerEvents(trigger);
        this.triggers.push(trigger);
        this.logger.info(`Trigger "${trigger.name}" added`);
        this.#eventDispatcher(routineEvents.routineTriggerAdded, trigger);
    }

    removeTrigger(triggerId: id): void {
        const trigger = this.triggers.find(t => t.id === triggerId);
        if (!trigger)
            throw new Error(`Trigger with id ${triggerId} not found`);

        this.#unbindTriggerEvents(trigger);
        this.triggers = this.triggers.filter(t => t.id !== triggerId);
        this.#eventDispatcher(routineEvents.routineTriggerRemoved, triggerId);
    }

    getTriggers(): TriggerInterface[] {
        return [...this.triggers];
    }

    #eventDispatcher(event: string, ...args: any[]): void {
        this.emit(event, ...args);
    }

    #taskTimeout({ cancelSignal }: { cancelSignal: AbortSignal }): Promise<void> {
        return new Promise((resolve, reject) => {
            if (!this.taskTimeout)
                return resolve();

            const timeoutTimer = setTimeout(() => {
                this.logger.warn(`Task timed out`);
                reject(new Error("Task timed out"));
            }, this.taskTimeout || 10000);

            cancelSignal.addEventListener("abort", () => {
                clearTimeout(timeoutTimer);
                resolve();
            });
        });
    }

    async #abortSignalController(): Promise<void> {
        const { signal: abortSignal } = this.abortController;

        this.#eventDispatcher(routineEvents.routineAborted, this.id);

        return new Promise((_resolve, reject) => {
            abortSignal.addEventListener("abort", () => {
                this.logger.warn(`Routine aborted with cause: ${this.abortController.signal.reason}`);
                reject(new Error(`Routine aborted: ${this.abortController.signal.reason}`));
            })
        })
    }

    async run(): Promise<void> {
        if (!this.enabled)
            throw new Error("Routine is not enabled");

        this.abortController = new AbortController();

        const handleOnError = (err: Error) => {
            this.logger.error(`Error running task: ${err?.message || err}`);
            this.#eventDispatcher(routineEvents.routineError, {routineId: this.id, error: err});
        }

        this.isRunning = true;
        this.#eventDispatcher(routineEvents.routineRunning, {routineId: this.id});

        const cleanOnFinish = () => {
            this.abortController = null;
            this.isRunning = false;
        }

        return new Promise(async (resolve, reject) => {
            const { signal: abortSignal } = this.abortController;

            const runInSync = async () => {
                for (const task of this.tasks) {
                    try {
                        this.logger.info(`Running task ${task.name}...`);
                        this.timeoutController = new AbortController();
                        const { signal: cancelSignal } = this.timeoutController;

                        await Promise.race([
                            task.run({ abortSignal }),
                            this.#taskTimeout({ cancelSignal })
                        ]);

                        this.logger.info(`Task ${task.name} completed`);
                        this.timeoutController.abort();
                    } catch (e) {
                        if (this.continueOnError) {
                            this.logger.warn(`Task failed: ${e?.message || e}`);
                            handleOnError(e);
                        } else {
                            handleOnError(e);
                            throw new Error("Task failed. Breaking execution 'Continue on error' is disabled");
                        }
                    }
                }
            }

            const runInParallel = async () => {
                this.timeoutController = new AbortController();
                const { signal: cancelSignal } = this.timeoutController;

                try {
                    if (this.continueOnError) {
                        this.logger.info("Running tasks in parallel with continueOnError...");

                        const result = await Promise.race([
                            Promise.allSettled(this.tasks.map(task => task.run({ abortSignal }))),
                            this.#abortSignalController(),
                            this.#taskTimeout({ cancelSignal })
                        ]) as PromiseSettledResult<void>[];

                        this.timeoutController.abort();

                        if (result.every((res) => res.status === 'fulfilled'))
                            this.logger.info(`Tasks completed: ${this.getTasks().map(task => task.name).join(', ')}`);
                        else
                            for (const res of result) {
                                if (res.status === 'rejected') {
                                    this.logger.warn(`Task failed: ${res.reason}`);
                                    handleOnError(res.reason);
                                } else {
                                    this.logger.info(`Task completed: ${res.value}`);
                                }
                            }

                    } else {
                        this.logger.info("Running tasks in parallel without continueOnError...");

                        const result = await Promise.race([
                            Promise.all(this.tasks.map(task => task.run({ abortSignal }))),
                            this.#abortSignalController(),
                            this.#taskTimeout({ cancelSignal })
                        ]);

                        this.timeoutController.abort();
                        this.logger.info(`Tasks completed: ${result}`);
                    }
                } catch (err) {
                    this.logger.error(`Error running tasks: ${err?.message || err}`);
                    handleOnError(err);
                }
            }

            try {
                if (this.runInSync)
                    await runInSync();
                else
                    await runInParallel();

                this.logger.info("Routine completed successfully");
                this.#eventDispatcher(routineEvents.routineCompleted, this.id);
                resolve();
            } catch (e) {
                this.logger.error(`Routine ended with error: ${e?.message || e}`);
                this.#eventDispatcher(routineEvents.routineFailed, this.id);
                reject(e);
            } finally {
                cleanOnFinish();
            }
        })
    }

    enable(): void {
        this.enabled = true;
        this.#eventDispatcher(routineEvents.routineEnabled, this.id);
    }

    disable(): void {
        this.enabled = false;
        this.#eventDispatcher(routineEvents.routineDisabled, this.id);
    }

    abort(cause: string): void {
        if (this.abortController)
            this.abortController.abort(cause);
    }

    toJson(): RoutineType {
        return {
            id: this.id,
            name: this.name,
            description: this.description,
            enabled: this.enabled,
            runInSync: this.runInSync,
            continueOnError: this.continueOnError,
            isRunning: this.isRunning,
            taskTimeout: this.taskTimeout,
            triggers: this.triggers.map(trigger => trigger.toJson()),
            tasks: this.tasks.map(task => task.toJson())
        };
    }

}
