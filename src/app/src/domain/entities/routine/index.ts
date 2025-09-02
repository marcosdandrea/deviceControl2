/**
 * @description "Create a routine to execute tasks in a specific order and with triggers"
 * @author "Marcos D'Andrea"
 * @date "21-05-2025"
 * @version "1.0.0"
 */

import routineEvents from "@common/events/routine.events";
import triggerEvents from "@common/events/trigger.events";
import { id, RunCtx } from "@common/types/commons.type";
import { RoutineInterface, RoutineStatus, RoutineType } from "@common/types/routine.type";
import { TaskInterface } from "@common/types/task.type";
import { TriggerInterface } from "@common/types/trigger.type";
import { Log } from "@src/utils/log";
import { EventEmitter } from "events";
import crypto from "crypto";
import { nanoid } from "nanoid";

export const RoutineActions = ["enable", "disable", "run", "stop"] as const;
export type RoutineActions = typeof RoutineActions[number];

export class Routine extends EventEmitter implements RoutineInterface {

    id: RoutineType["id"];
    name: RoutineType["name"];
    description: RoutineType["description"];
    enabled: RoutineType["enabled"];
    runInSync: RoutineType["runInSync"];
    continueOnError: RoutineType["continueOnError"];
    isRunning: RoutineInterface["isRunning"];
    routineTimeout: number | false;
    hidden?: boolean = false;
    status?: RoutineStatus = "unknown";
    autoCheckConditionEveryMs?: number | false;
    suspendAutoCheckConditions: boolean = false;
    failed?: boolean;

    tasks: TaskInterface[] = [];
    triggers: TriggerInterface[] = [];

    private _anyListeners: Function[];

    logger: Log;
    abortController: AbortController | null;
    timeoutController: AbortController | null;

    constructor(props: RoutineType) {
        super();
        this._anyListeners = [];

        this.id = props.id || crypto.randomUUID();
        this.name = props.name;
        this.description = props.description;
        this.status = "unknown";
        this.enabled = props.enabled;
        this.runInSync = props.runInSync || false;
        this.continueOnError = props.continueOnError || true;
        this.triggers = [];
        this.isRunning = false;
        this.failed = false;
        this.hidden = props.hidden || false;
        this.routineTimeout = props.routineTimeout || 10000;

        this.autoCheckConditionEveryMs = props.autoCheckConditionEveryMs || false;
        this.suspendAutoCheckConditions = false;

        this.logger = new Log(`Routine "${this.name}"`, true, true);
        this.abortController = null

        this.on(routineEvents.routineEnabled, () => {
            if (this.autoCheckConditionEveryMs != false)
                this.#autoCheckConditions();
        });


    }

    #setStatus(status: RoutineStatus): Boolean {
        if (this.status === status)
            return false
        this.logger.info(`Routine status changed to ${status}`);
        this.status = status
        return true
    }

    stopAutoCheckingConditions() {
        if (this.autoCheckConditionEveryMs !== false) {
            clearTimeout(this.autoCheckConditionEveryMs);
            this.autoCheckConditionEveryMs = false;
            this.logger.info("Stopped auto checking conditions");
        }
    }

    async #suspendAutoCheckingConditions() {
        this.suspendAutoCheckConditions = true;
        this.logger.info("Suspended auto checking conditions");
    }

    async #resumeAutoCheckingConditions() {
        if (this.autoCheckConditionEveryMs) {
            this.logger.info("Resumed auto checking conditions");
            setTimeout(() => {
                this.#autoCheckConditions()
            }, this.autoCheckConditionEveryMs)
        }
    }

    async #autoCheckConditions() {

        if (this.enabled === false) return;

        if (typeof this.autoCheckConditionEveryMs !== 'number' || this.autoCheckConditionEveryMs < 1000) {
            this.logger.error("autoCheckConditionEveryMs must be a number greater than 1000 or false")
            return;
        }

        this.suspendAutoCheckConditions = false;

        try {
            if (this.suspendAutoCheckConditions) return

            this.#eventDispatcher(routineEvents.routineAutoCheckingConditions);
            if (!await this.checkAllTaskConditions())
                throw new Error("Not all task conditions are met");

            if (this.suspendAutoCheckConditions) return

            if (this.#setStatus("completed"))
                this.#eventDispatcher(routineEvents.routineCompleted);
            else
                this.#eventDispatcher(routineEvents.routineIdle);

        } catch (err) {
            if (this.suspendAutoCheckConditions) return

            if (this.#setStatus("failed"))
                this.#eventDispatcher(routineEvents.routineFailed);
            else
                this.#eventDispatcher(routineEvents.routineIdle);

        } finally {
            if (this.suspendAutoCheckConditions) return
            if (typeof this.autoCheckConditionEveryMs !== "number") return;
            this.logger.info(`Auto checking conditions in ${this.autoCheckConditionEveryMs}ms`);
            setTimeout(() => {
                this.#autoCheckConditions();
            }, this.autoCheckConditionEveryMs);
        }
    }


    setExecutionModeInSync(runInSync: boolean): void {
        if (typeof runInSync !== 'boolean')
            throw new Error("Execution mode must be a boolean");

        this.runInSync = runInSync;
        this.logger.info(`Run in sync mode set to ${runInSync}`);
        this.#eventDispatcher(routineEvents.routineExecutionModeChanged, { runInSync });
    }

    addTask(task: TaskInterface): void {
        this.tasks.push(task);
        this.logger.info(`Task ${task.name} added`);
        this.#eventDispatcher(routineEvents.routineTaskAdded, { taskId: task.id });
    }

    removeTask(taskId: id): void {
        const task = this.tasks.find(t => t.id === taskId);
        if (!task)
            throw new Error(`Task with id ${taskId} not found`);

        this.tasks = this.tasks.filter(t => t.id !== taskId);
        this.#eventDispatcher(routineEvents.routineTaskRemoved, { taskId: task.id });

    }

    removeAllTasks(): void {
        this.tasks.forEach(task => {
            this.#eventDispatcher(routineEvents.routineTaskRemoved, { taskId: task.id });
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
        this.#eventDispatcher(routineEvents.routineTaskOrderChanged, { taskToMoveId: taskToMove.id, newIndex });
    }

    async #onTriggerExecute(trigger: TriggerInterface): Promise<void> {
        this.logger.info(`Trigger ${trigger.name} executed`);
        this.#eventDispatcher(routineEvents.routineTriggerTriggered, { triggerId: trigger.id });
        try {
            await this.run(trigger);
        } catch (err) {
            this.logger.error(`Error executing trigger ${trigger.name}: ${err.message}`);
        }
    }

    #bindTriggerEvents(trigger: TriggerInterface): void {
        trigger.on(triggerEvents.triggered, this.#onTriggerExecute.bind(this, trigger));
        this.logger.info(`Trigger "${trigger.name}" bound`);
    }

    #unbindTriggerEvents(trigger: TriggerInterface): void {
        trigger.off(triggerEvents.triggered, this.#onTriggerExecute.bind(this, trigger));
        this.logger.info(`Trigger "${trigger.name}" unbound`);
    }

    addTrigger(trigger: TriggerInterface): void {
        if (this.triggers.find(t => t.id === trigger.id))
            throw new Error(`Trigger with id ${trigger.id} already exists`);

        this.#bindTriggerEvents(trigger);
        this.triggers.push(trigger);
        this.logger.info(`Trigger "${trigger.name}" added`);
        this.#eventDispatcher(routineEvents.routineTriggerAdded, { triggerId: trigger.id, triggerName: trigger.name, triggerType: trigger.type });

        const armTrigger = () => {
            if (this.enabled && !trigger.armed)
                trigger.arm();
        }

        this.on(routineEvents.routineEnabled, armTrigger);
        armTrigger();
    }

    removeTrigger(triggerId: id): void {
        const trigger = this.triggers.find(t => t.id === triggerId);
        if (!trigger)
            throw new Error(`Trigger with id ${triggerId} not found`);

        this.#unbindTriggerEvents(trigger);
        this.triggers = this.triggers.filter(t => t.id !== triggerId);
        this.#eventDispatcher(routineEvents.routineTriggerRemoved, { triggerId: trigger.id, triggerName: trigger.name, triggerType: trigger.type });
    }

    getTriggers(): TriggerInterface[] {
        return [...this.triggers];
    }

    #eventDispatcher(event: string, ...args: any[]): void {
        const newArgs = {
            routineId: this.id,
            ...args
        }
        //this.eventManager.emit(event, newArgs);
        this.emit(event, newArgs);

        for (const listener of this._anyListeners) {
            try {
                listener(event, ...args);
            } catch (err) {
                this.emit('error', err);
            }
        }
    }

    onAny(listener) {
        this._anyListeners.push(listener);
        return this;
    }

    offAny(listener) {
        this._anyListeners = this._anyListeners.filter(l => l !== listener);
        return this;
    }

    #taskTimeout({ cancelSignal }: { cancelSignal: AbortSignal }): Promise<void> {
        return new Promise((resolve, reject) => {
            if (!this.routineTimeout)
                return resolve();

            const timeoutTimer = setTimeout(() => {
                this.logger.warn(`Task timed out after ${this.routineTimeout}ms`);
                reject(new Error("Task timed out after " + this.routineTimeout + "ms"));
            }, this.routineTimeout || 10000);

            cancelSignal.addEventListener("abort", () => {
                this.logger.info(`Task timeout cancelled`);
                clearTimeout(timeoutTimer);
                resolve();
            });
        });
    }

    async #abortSignalController(): Promise<void> {
        const { signal: abortSignal } = this.abortController;

        return new Promise((_resolve, reject) => {
            abortSignal.addEventListener("abort", () => {
                this.#eventDispatcher(routineEvents.routineAborted);
                this.logger.warn(`Routine aborted with cause: ${this.abortController.signal.reason}`);
                reject(new Error(`Routine aborted: ${this.abortController.signal.reason}`));
            });
        });
    }

    async checkAllTaskConditions(): Promise<boolean> {
        const tasksWithConditions = this.tasks.filter(t => t.condition);
        if (tasksWithConditions.length === 0) return true;

        const ctx = { 
            executionId: nanoid(8),
            hierarchy: [{type: 'routine', name: this.name}],
            baseLogger: this.logger
        } as RunCtx;

        this.logger.info(`Autochecking conditions for ${tasksWithConditions.length} tasks`, null, ctx);

        const abortController = new AbortController();
        const { signal: abortSignal } = abortController;
        const results = await Promise.all(tasksWithConditions.map(t => {

            const taskCtx = { 
                ...ctx, 
                hierarchy: [...ctx.hierarchy, {type: 'task', name: t.name}] 
            };

            return t.condition!.evaluate({ abortSignal, runCtx: taskCtx });
        }));
        return results.every(res => res === true);
    }

    async run(triggeredBy: TriggerInterface): Promise<void> {
        if (!this.enabled)
            throw new Error(`Routine ${this.name} is not enabled`);

        if (!triggeredBy?.id)
            throw new Error(`Routine ${this.name} is not triggered by a valid trigger`);

        if (this.isRunning)
            throw new Error(`Routine ${this.name} is already running`);

        this.abortController = new AbortController();

        const handleOnError = (err: Error) => {
            this.failed = true;
            this.logger.error(`Error running tasks: ${err?.message || err}`);
            this.#eventDispatcher(routineEvents.routineError, { error: err });
        }

        this.#suspendAutoCheckingConditions()
        this.isRunning = true;
        this.failed = false;
        this.#setStatus("running");
        this.#eventDispatcher(routineEvents.routineRunning, { routineId: this.id });

        const cleanOnFinish = () => {
            this.abortController = null;
            this.isRunning = false
        }

        const ctx = { 
            executionId: nanoid(8),
            baseLogger: this.logger,
            hierarchy: [{type: 'routine', name: this.name}] 
        } as RunCtx;

        this.logger.info(`Starting routine. Triggered by ${triggeredBy.name}`, null, ctx);

        return new Promise(async (resolve, reject) => {
            const { signal: abortSignal } = this.abortController;

            const runInSync = async () => {
                this.logger.info("Running tasks in sync...", null, ctx);
                for (const task of this.tasks) {
                    try {
                        this.logger.info(`Running task ${task.name}...`, null, ctx);
                        this.timeoutController = new AbortController();
                        const { signal: cancelSignal } = this.timeoutController;

                        await Promise.race([
                            task.run({ abortSignal, runCtx: ctx }),
                            this.#taskTimeout({ cancelSignal })
                        ]);

                        this.logger.info(`Task ${task.name} completed`, null, ctx);
                        this.timeoutController.abort();
                    } catch (e) {
                        if (this.continueOnError) {
                            this.logger.warn(`Task failed: ${e?.message || e}`, null, ctx);
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
                        this.logger.info("Running tasks in parallel with continueOnError...", null, ctx);

                        const result = await Promise.race([
                            Promise.allSettled(this.tasks.map(task => task.run({ abortSignal, runCtx: ctx }))),
                            this.#abortSignalController(),
                            this.#taskTimeout({ cancelSignal })
                        ]) as PromiseSettledResult<void>[];

                        this.timeoutController.abort();

                        if (result.every((res) => res.status === 'fulfilled'))
                            this.logger.info(`Tasks completed: ${this.getTasks().map(task => task.name).join(', ')}`, null, ctx);
                        else
                            for (const res of result) {
                                if (res.status === 'rejected') {
                                    this.logger.warn(`Task failed: ${res.reason}`, null, ctx);
                                    handleOnError(res.reason);
                                } else {
                                    this.logger.info(`Task completed: ${res.value}`, null, ctx);
                                }
                            }

                    } else {
                        this.logger.info("Running tasks in parallel without continueOnError...", null, ctx);

                        const result = await Promise.race([
                            Promise.all(this.tasks.map(task => task.run({ abortSignal, runCtx: ctx }))),
                            this.#abortSignalController(),
                            this.#taskTimeout({ cancelSignal })
                        ]);

                        this.timeoutController.abort();
                        this.logger.info(`Tasks completed: ${result}`);
                    }
                } catch (err) {
                    if (!this.abortController?.signal.aborted)
                        handleOnError(err)
                }
            }

            try {
                if (this.runInSync)
                    await runInSync();
                else
                    await runInParallel();


                if (this.failed) {
                    if (this.#setStatus("failed")) {
                        this.logger.error("Routine ended with errors", null, ctx);
                        this.#eventDispatcher(routineEvents.routineFailed);
                    }
                } else if (!this.abortController || !this.abortController.signal.aborted) {
                    if (this.#setStatus("completed")) {
                        this.logger.info("Routine completed successfully", null, ctx);
                        this.#eventDispatcher(routineEvents.routineCompleted);
                    }
                } else {
                    this.logger.warn("Routine was aborted", null, ctx);
                }

                resolve();
            } catch (e) {
                if (this.#setStatus("failed")) {
                    this.logger.error(`Routine ended with error: ${e?.message || e}`, null, ctx);
                    this.#eventDispatcher(routineEvents.routineFailed);
                }
                reject(e);
            } finally {
                cleanOnFinish();
                this.#resumeAutoCheckingConditions()
            }
        })
    }

    enable(): void {
        this.enabled = true;
        this.#eventDispatcher(routineEvents.routineEnabled);
    }

    disable(): void {
        this.enabled = false;
        this.#eventDispatcher(routineEvents.routineDisabled);
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
            status: this.status,
            enabled: this.enabled,
            runInSync: this.runInSync,
            continueOnError: this.continueOnError,
            isRunning: this.isRunning,
            routineTimeout: this.routineTimeout,
            autoCheckConditionEveryMs: this.autoCheckConditionEveryMs,
            hidden: this.hidden,
            triggersId: this.triggers.map(trigger => trigger.id),
            tasksId: this.tasks.map(task => task.id)
        }
    }

}
