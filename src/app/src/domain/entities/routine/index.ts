/**
 * @description "Create a routine to execute tasks in a specific order and with triggers"
 * @author "Marcos D'Andrea"
 * @date "21-05-2025"
 * @version "1.0.0"
 */

import routineEvents from "@common/events/routine.events";
import triggerEvents from "@common/events/trigger.events";
import { id } from "@common/types/commons.type";
import { RoutineInterface, RoutineStatus, RoutineType } from "@common/types/routine.type";
import { TaskInterface } from "@common/types/task.type";
import { TriggerInterface } from "@common/types/trigger.type";
import { Log } from "@src/utils/log";
import { EventEmitter } from "events";
import crypto from "crypto";
import { Trigger } from "../trigger";
import { Context } from "../context";
import { TimeoutController } from "@src/controllers/Timeout";
import timeoutEvents from "@common/events/timeout.events";

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
    timeoutController: TimeoutController | null = null;

    constructor(props: RoutineType) {
        super();
        this._anyListeners = [];

        this.id = props.id || crypto.randomUUID();
        this.name = props.name;
        this.description = props.description;
        this.status = "unknown";
        this.enabled = props.enabled;
        this.runInSync = props.runInSync;
        this.continueOnError = props.continueOnError;
        this.triggers = [];
        this.isRunning = false;
        this.failed = false;
        this.hidden = props.hidden;
        this.routineTimeout = props.routineTimeout || 10000;

        this.autoCheckConditionEveryMs = props.autoCheckConditionEveryMs || false;
        this.suspendAutoCheckConditions = false;

        this.logger = Log.createInstance(`Routine "${this.name}"`, true);
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

    async #onTriggerExecute(trigger: TriggerInterface, args: any): Promise<void> {
        this.logger.info(`Trigger ${trigger.name} executed`);
        this.#eventDispatcher(routineEvents.routineTriggerTriggered, { triggerId: trigger.id });

        const { ctx } = args;

        if (!(ctx instanceof Context))
            throw new Error(`Invalid context provided on listener`);

        try {
            await this.run(trigger, ctx);
        } catch (err) {
            this.logger.error(`Error executing trigger ${trigger.name}: ${err.message}`);
        }
    }

    #bindTriggerEvents(trigger: TriggerInterface): void {
        trigger.on(triggerEvents.triggered, (ctx) => this.#onTriggerExecute(trigger, ctx));
        this.logger.info(`Trigger "${trigger.name}" bound`);
    }

    #unbindTriggerEvents(trigger: TriggerInterface): void {
        trigger.off(triggerEvents.triggered, (ctx) => this.#onTriggerExecute(trigger, ctx));
        this.logger.info(`Trigger "${trigger.name}" unbound`);
    }

    addTrigger(trigger: TriggerInterface): void {

        if (!(trigger instanceof Trigger))
            throw new Error("Invalid trigger");

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


    async checkAllTaskConditions(): Promise<boolean> {
        const tasksWithConditions = this.tasks.filter(t => t.condition);
        if (tasksWithConditions.length === 0) return true;

        const ctx = Context.createRootContext({ type: "routine", id: this.id });

        ctx.log.info(`Autochecking conditions for ${tasksWithConditions.length} tasks`);

        const abortController = new AbortController();
        const { signal: abortSignal } = abortController;
        const results = await Promise.all(tasksWithConditions.map(task => {

            ctx.log.info(`Checking condition for task ${task.name}`, [this.id]);

            return task.condition!.evaluate({ abortSignal, ctx });
        }));
        return results.every(res => res === true);
    }

    async run(triggeredBy: TriggerInterface, ctx: Context): Promise<void> {
        if (!this.enabled)
            throw new Error(`Routine ${this.name} is not enabled`);

        if (!triggeredBy?.id)
            throw new Error(`Routine ${this.name} is not triggered by a valid trigger`);

        if (this.isRunning)
            throw new Error(`Routine ${this.name} is already running`);

        if (!(ctx instanceof Context)) {
            throw new Error(`Invalid context provided`);
        }

        this.abortController = new AbortController();
        const { signal: userAbortSignal } = this.abortController;        
        
        this.#suspendAutoCheckingConditions()
        this.isRunning = true;
        this.failed = false;
        this.#setStatus("running");
        this.#eventDispatcher(routineEvents.routineRunning, { routineId: this.id });

        const cleanOnFinish = () => {
            this.abortController = null;
            this.isRunning = false
        }

        const ctxNode = {
            type: 'routine',
            id: this.id,
            name: this.name
        };
        const childCtx = ctx.createChildContext(ctxNode);
        childCtx.log.info(`Routine ${this.name} started`);

        childCtx.onFinish((data) => {
            this.#eventDispatcher(routineEvents.routineFinished, data);
        });

        return new Promise(async (resolve, reject) => {

            const runInSync = async (abortSignal: AbortSignal) => {
                this.logger.info(childCtx.log.info("Running tasks in sync..."));

                for (const task of this.tasks) {
                    try {
                        childCtx.log.info(`Running task ${task.name}...`);
                        await task.run({ abortSignal, runCtx: childCtx });
                        childCtx.log.info(`Task ${task.name} completed`);
                    } catch (e) {
                        if (abortSignal.aborted) {
                            childCtx.log.warn(`Task ${task.name} aborted: ${abortSignal.reason}`);
                            this.#setStatus("aborted");
                            throw new Error(`Routine aborted: ${abortSignal.reason}`);
                        }
                        if (this.continueOnError) {
                            childCtx.log.warn(`Task failed: ${e?.message || e}`);
                            this.#setStatus("failed");
                        } else {
                            this.#setStatus("failed");
                            throw new Error("Task failed. Breaking execution 'Continue on error' is disabled");
                        }
                    }
                }

            }

            const runInParallelBreakOnError = async (abortSignal: AbortSignal) => {
                return new Promise<void>(async (resolve, reject) => {

                    this.logger.info(childCtx.log.info("Running tasks in parallel without continueOnError..."));
                    try {
                        const result = await Promise.all(this.tasks.map(task => task.run({ abortSignal, runCtx: childCtx })))
                        childCtx.log.info(`Tasks completed: ${result}`);
                        resolve();
                    } catch (e) {
                        if (abortSignal.aborted) {
                            childCtx.log.warn(`Tasks aborted: ${abortSignal.reason}`);
                            this.#setStatus("aborted");
                            return reject(new Error(`Routine aborted: ${abortSignal.reason}`));
                        }
                        this.#setStatus("failed");
                        return reject(e);
                    }
                });
            }

            const runInParallelContinueOnError = async (abortSignal: AbortSignal) => {

                return new Promise<void>(async (resolve, reject) => {
                    this.logger.info(childCtx.log.info("Running tasks in parallel with continueOnError..."));

                    const result = await Promise.allSettled(this.tasks.map(task => task.run({ abortSignal, runCtx: childCtx })))

                    if (result.every((res) => res.status === 'fulfilled')) {
                        childCtx.log.info(`Tasks completed: ${this.getTasks().map(task => task.name).join(', ')}`);
                        this.#setStatus("completed");
                        resolve();
                    } else {
                        for (const res of result) {
                            if (res.status === 'rejected') {
                                childCtx.log.warn(`Task failed: ${res.reason}`);
                            } else {
                                childCtx.log.info(`Task completed: ${res.value}`);
                            }
                        }
                        this.#setStatus("failed");
                        reject("Some tasks failed. Check logs for details")
                    }
                })
            }

            //starts timeout controller if routineTimeout is set
            if (this.routineTimeout && this.routineTimeout > 0) {
                this.timeoutController = new TimeoutController(this.routineTimeout);
            }

            //local abort controller for abort tasks
            const abortTasksController = new AbortController();
            const { signal: abortTasksSignal } = abortTasksController;

            //handler to abort tasks when routine is aborted or timeout occurs
            const handleOnAbortExecution = () => {
                abortTasksController.abort("Routine aborted");
            }

            userAbortSignal.addEventListener("abort", handleOnAbortExecution);
            this.timeoutController.on(timeoutEvents.timeout, handleOnAbortExecution)

            try {

                if (this.runInSync)
                    await Promise.race([
                        runInSync(abortTasksSignal),
                        this.timeoutController.start(this.abortController.signal),
                    ])
                else
                    if (this.continueOnError)
                        await Promise.race([
                            runInParallelContinueOnError(abortTasksSignal),
                            this.timeoutController.start(this.abortController.signal),
                        ]);
                    else
                        await Promise.race([
                            runInParallelBreakOnError(abortTasksSignal),
                            this.timeoutController.start(this.abortController.signal),
                        ]);

                this.#setStatus("completed")
                this.logger.info(childCtx.log.info("Routine completed successfully"));
                this.#eventDispatcher(routineEvents.routineCompleted);

                resolve();
            } catch (e) {

                    if (userAbortSignal.aborted) {
                        this.#setStatus("aborted");
                        this.logger.warn(childCtx.log.warn(`Routine aborted by user: ${e?.message || e}`))
                        this.#eventDispatcher(routineEvents.routineAborted);
                    } else if (this.timeoutController?.timedout) {
                        this.logger.warn(childCtx.log.warn(`Routine timed out: ${e?.message || e}`))
                        this.#eventDispatcher(routineEvents.routineTimeout);
                        this.#setStatus("timedout");
                    } else {
                        this.#setStatus("failed");
                        this.logger.error(childCtx.log.error(`Routine ended with error: ${e?.message || e}`))
                        this.#eventDispatcher(routineEvents.routineFailed);
                    }

                reject(e);
            } finally {
                userAbortSignal.removeEventListener("abort", handleOnAbortExecution);
                this.timeoutController?.clear()
                this.timeoutController?.removeAllListeners();
                cleanOnFinish();
                this.#resumeAutoCheckingConditions();
                childCtx.finish();
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
