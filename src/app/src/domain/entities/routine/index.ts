/**
 * @description "Create a routine to execute tasks in a specific order and with triggers"
 * @author "Marcos D'Andrea"
 * @date "21-05-2025"
 * @version "1.0.0"
 */

import routineEvents from "@common/events/routine.events";
import triggerEvents from "@common/events/trigger.events";
import { id } from "@common/types/commons.type";
import { RoutineInterface, RoutineStatus, RoutineType, TaskInstance, TriggerInstance } from "@common/types/routine.type";
import { TaskInterface } from "@common/types/task.type";
import { TriggerInterface } from "@common/types/trigger.type";
import { Log } from "@src/utils/log";
import { EventEmitter } from "events";
import crypto from "crypto";
import { nanoid } from "nanoid";
import { Trigger } from "../trigger";
import { Context } from "../context";
import { TimeoutController } from "@src/controllers/Timeout";
import timeoutEvents from "@common/events/timeout.events";
import dictionary from "@common/i18n";

export const RoutineActions = ["enable", "disable", "run", "stop"] as const;
export type RoutineActions = typeof RoutineActions[number];

const defaultRoutineTimeout = process.env.ROUTINE_DEFAULT_TIMEOUT_MS ? parseInt(process.env.ROUTINE_DEFAULT_TIMEOUT_MS) : 60000;

export class Routine extends EventEmitter implements RoutineInterface {

    id: RoutineType["id"];
    name: RoutineType["name"];
    description: RoutineType["description"];
    groupId: RoutineType["groupId"];
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
    taskInstances: TaskInstance[] = [];
    triggerInstances: TriggerInstance[] = [];

    private _anyListeners: Function[];
    private _autoCheckTimeoutId: NodeJS.Timeout | null = null;

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
        this.groupId = props.groupId || null;
        this.triggers = [];
        this.isRunning = false;
        this.failed = false;
        this.hidden = props.hidden;
        this.routineTimeout = props.routineTimeout || defaultRoutineTimeout;

        this.taskInstances = props.tasksId ? [...props.tasksId] : [];
        this.triggerInstances = props.triggersId ? [...props.triggersId] : [];

        this.autoCheckConditionEveryMs = props.autoCheckConditionEveryMs || false;
        this.suspendAutoCheckConditions = false;

        this.logger = Log.createInstance(`Routine "${this.name}"`, true);
        this.abortController = null

        this.on(routineEvents.routineEnabled, () => {
            if (this.autoCheckConditionEveryMs !== false && typeof this.autoCheckConditionEveryMs === 'number')
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
        if (this._autoCheckTimeoutId !== null) {
            clearTimeout(this._autoCheckTimeoutId);
            this._autoCheckTimeoutId = null;
            this.logger.info("Stopped auto checking conditions");
        }
    }

    async #suspendAutoCheckingConditions() {
        this.suspendAutoCheckConditions = true;
        if (this._autoCheckTimeoutId !== null) {
            clearTimeout(this._autoCheckTimeoutId);
            this._autoCheckTimeoutId = null;
        }
        this.logger.info("Suspended auto checking conditions");
    }

    async #resumeAutoCheckingConditions() {
        this.suspendAutoCheckConditions = false;
        if (this.autoCheckConditionEveryMs && typeof this.autoCheckConditionEveryMs === 'number') {
            this.logger.info("Resumed auto checking conditions");
            this._autoCheckTimeoutId = setTimeout(() => {
                this.#autoCheckConditions();
            }, this.autoCheckConditionEveryMs);
        }
    }

    async #autoCheckConditions() {

        if (this.enabled === false) return;

        if (typeof this.autoCheckConditionEveryMs !== 'number' || this.autoCheckConditionEveryMs < 1000) {
            this.logger.error("autoCheckConditionEveryMs must be a number greater than 1000 or false")
            return;
        }

        if (this.suspendAutoCheckConditions) return;

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
            this._autoCheckTimeoutId = setTimeout(() => {
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

    addTask(task: TaskInterface, instanceId?: id): void {
        if (!instanceId || !this.taskInstances.some(instance => instance.id === instanceId)) {
            const resolvedInstanceId = instanceId || nanoid(8);
            this.taskInstances.push({ id: resolvedInstanceId, taskId: task.id });
            instanceId = resolvedInstanceId;
        }

        this.tasks.push(task);
        this.logger.info(`Task ${task.name} added`);
        this.#eventDispatcher(routineEvents.routineTaskAdded, { taskId: task.id, taskInstanceId: instanceId });
    }

    removeTask(taskId: id, instanceId?: id): void {
        let taskIndex = -1;

        if (instanceId)
            taskIndex = this.taskInstances.findIndex(instance => instance.id === instanceId);

        if (taskIndex === -1)
            taskIndex = this.tasks.findIndex(t => t.id === taskId);

        if (taskIndex === -1)
            throw new Error(`Task with id ${taskId} not found`);

        const [removedTask] = this.tasks.splice(taskIndex, 1);
        const [removedInstance] = this.taskInstances.splice(taskIndex, 1);

        this.#eventDispatcher(routineEvents.routineTaskRemoved, { taskId: removedTask.id, taskInstanceId: removedInstance?.id });

    }

    removeAllTasks(): void {
        this.tasks.forEach((task, index) => {
            this.#eventDispatcher(routineEvents.routineTaskRemoved, { taskId: task.id, taskInstanceId: this.taskInstances[index]?.id });
        });
        this.tasks = [];
        this.taskInstances = [];
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
        const taskInstanceToSwap = this.taskInstances[newIndex];
        const taskInstanceToMove = this.taskInstances[taskIndex];

        this.tasks[newIndex] = taskToMove;
        this.tasks[taskIndex] = taskToSwap;
        this.taskInstances[newIndex] = taskInstanceToMove;
        this.taskInstances[taskIndex] = taskInstanceToSwap;

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
            this.logger.error(`Error executing routine ${this.name} using trigger ${trigger.name}: ${err.message}`);
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

    addTrigger(trigger: TriggerInterface, instanceId?: id): void {

        if (!(trigger instanceof Trigger))
            throw new Error("Invalid trigger");

        let resolvedInstanceId = instanceId;
        if (!instanceId || !this.triggerInstances.some(instance => instance.id === instanceId)) {
            resolvedInstanceId = instanceId || nanoid(8);
            this.triggerInstances.push({ id: resolvedInstanceId, triggerId: trigger.id });
        }

        if (!this.triggers.find(t => t.id === trigger.id)) {
            this.#bindTriggerEvents(trigger);
            this.triggers.push(trigger);
        }

        this.logger.info(`Trigger "${trigger.name}" added`);
        this.#eventDispatcher(routineEvents.routineTriggerAdded, { triggerId: trigger.id, triggerInstanceId: resolvedInstanceId, triggerName: trigger.name, triggerType: trigger.type });

        const armTrigger = () => {
            if (this.enabled && !trigger.armed)
                trigger.arm();
        }

        this.on(routineEvents.routineEnabled, armTrigger);
        armTrigger();
    }

    removeTrigger(triggerId: id, instanceId?: id): void {
        const trigger = this.triggers.find(t => t.id === triggerId);
        if (!trigger)
            throw new Error(`Trigger with id ${triggerId} not found`);

        let instanceIndex = -1;

        if (instanceId)
            instanceIndex = this.triggerInstances.findIndex(instance => instance.id === instanceId);

        if (instanceIndex === -1)
            instanceIndex = this.triggerInstances.findIndex(instance => instance.triggerId === triggerId);

        if (instanceIndex === -1)
            throw new Error(`Trigger instance with id ${instanceId || triggerId} not found`);

        const [removedInstance] = this.triggerInstances.splice(instanceIndex, 1);
        const hasRemainingInstances = this.triggerInstances.some(instance => instance.triggerId === triggerId);

        if (!hasRemainingInstances) {
            this.#unbindTriggerEvents(trigger);
            this.triggers = this.triggers.filter(t => t.id !== triggerId);
        }

        this.#eventDispatcher(routineEvents.routineTriggerRemoved, { triggerId: trigger.id, triggerInstanceId: removedInstance?.id, triggerName: trigger.name, triggerType: trigger.type });
    }

    getTriggers(): TriggerInterface[] {
        return [...this.triggers];
    }

    private getDisplayName(): string {
        return this.name || this.id;
    }

    private getTaskDisplayName(task: TaskInterface): string {
        return task?.name || task?.id || "";
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

        const ctx = Context.createRootContext({ type: "routine", id: this.id, name: this.name });

        ctx.log.info(dictionary("app.domain.entities.routine.autoCheckingConditions", tasksWithConditions.length));

        const abortController = new AbortController();
        const { signal: abortSignal } = abortController;
        const results = await Promise.all(tasksWithConditions.map(task => {

            ctx.log.info(dictionary("app.domain.entities.routine.checkingConditionForTask", this.getTaskDisplayName(task)), [this.id]);

            return task.condition!.evaluate({ abortSignal, ctx });
        }));
        return results.every(res => res === true);
    }

    async run(triggeredBy: TriggerInterface, ctx: Context): Promise<void> {
        const displayName = this.getDisplayName();

        if (!this.enabled)
            throw new Error(dictionary("app.domain.entities.routine.notEnabled", displayName));

        if (!triggeredBy?.id)
            throw new Error(dictionary("app.domain.entities.routine.invalidTrigger", displayName));

        if (this.isRunning)
            throw new Error(dictionary("app.domain.entities.routine.alreadyRunning", displayName));

        if (!(ctx instanceof Context)) {
            throw new Error(dictionary("app.domain.entities.routine.invalidContext", displayName));
        }

        const routineStartTime = Date.now();

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
        childCtx.log.info(dictionary("app.domain.entities.routine.started", displayName));


        childCtx.onFinish((data) => {
            this.#eventDispatcher(routineEvents.routineFinished, data);
        });

        return new Promise(async (resolve, reject) => {

            const runInSync = async (abortSignal: AbortSignal) => {
                return new Promise<void>(async (resolve, reject) => {
                    this.logger.info(childCtx.log.info(dictionary("app.domain.entities.routine.runningTasksInSync")));

                    for (const task of this.tasks) {

                        if (this.timeoutController?.timedout || abortSignal.aborted) 
                            break
                        

                        try {
                            childCtx.log.info(dictionary("app.domain.entities.routine.runningTask", this.getTaskDisplayName(task)));
                            await task.run({ abortSignal, runCtx: childCtx });
                            childCtx.log.info(dictionary("app.domain.entities.routine.taskCompleted", this.getTaskDisplayName(task)));
                        } catch (e) {
                            if (abortSignal.aborted) {
                                childCtx.log.warn(dictionary("app.domain.entities.routine.taskAborted", this.getTaskDisplayName(task), String(abortSignal.reason)));
                                this.#setStatus("aborted");
                                reject(dictionary("app.domain.entities.routine.aborted", String(abortSignal.reason ?? "")));
                            }
                            if (this.continueOnError) {
                                childCtx.log.warn(dictionary("app.domain.entities.routine.taskFailed", this.getTaskDisplayName(task), e?.message || String(e)));
                            } else {
                                this.#setStatus("failed");
                                reject(dictionary("app.domain.entities.routine.breakOnErrorDisabled"));
                                break;
                            }
                        }
                    }

                    if (this.continueOnError && this.tasks.some(t => t.failed)){
                        this.#setStatus("failed")
                        reject(dictionary("app.domain.entities.routine.oneOrMoreTasksFailed"))
                    } else {
                        this.#setStatus("completed")
                        resolve()
                    }
                    
                })
            }

            const runInParallelBreakOnError = async (abortSignal: AbortSignal) => {
                return new Promise<void>(async (resolve, reject) => {

                    this.logger.info(childCtx.log.info(dictionary("app.domain.entities.routine.runningTasksInParallelBreak")));
                    try {
                        const result = await Promise.all(this.tasks.map(task => task.run({ abortSignal, runCtx: childCtx })));
                        childCtx.log.info(dictionary("app.domain.entities.routine.tasksCompletedWithResult", JSON.stringify(result)));
                        resolve();
                    } catch (e) {
                        if (abortSignal.aborted) {
                            childCtx.log.warn(dictionary("app.domain.entities.routine.tasksAborted", String(abortSignal.reason)));
                            this.#setStatus("aborted");
                            return reject(new Error(dictionary("app.domain.entities.routine.aborted", String(abortSignal.reason ?? ""))));
                        }
                        this.#setStatus("failed");
                        return reject(e);
                    }
                });
            }

            const runInParallelContinueOnError = async (abortSignal: AbortSignal) => {

                return new Promise<void>(async (resolve, reject) => {
                    this.logger.info(childCtx.log.info(dictionary("app.domain.entities.routine.runningTasksInParallelContinue")));

                    const result = await Promise.allSettled(this.tasks.map(task => task.run({ abortSignal, runCtx: childCtx })));

                    if (result.every((res) => res.status === 'fulfilled')) {
                        const completedTaskNames = this.getTasks().map(task => this.getTaskDisplayName(task)).join(', ');
                        childCtx.log.info(dictionary("app.domain.entities.routine.tasksCompletedList", completedTaskNames));
                        this.#setStatus("completed");
                        resolve();
                    } else {
                        for (const res of result) {
                            if (res.status === 'rejected') {
                                childCtx.log.warn(dictionary("app.domain.entities.routine.taskFailedReason", String(res.reason)));
                            } else {
                                childCtx.log.info(dictionary("app.domain.entities.routine.taskFulfilledValue", String(res.value)));
                            }
                        }
                        this.#setStatus("failed");
                        reject(new Error(dictionary("app.domain.entities.routine.tasksFailedDetails")))
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
                abortTasksController.abort(dictionary("app.domain.entities.routine.abortSignal"));
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
                this.logger.info(childCtx.finish.info(dictionary("app.domain.entities.routine.completed", Date.now() - routineStartTime)));
                this.#eventDispatcher(routineEvents.routineCompleted);

                resolve();
            } catch (e) {

                if (userAbortSignal.aborted) {
                    this.#setStatus("aborted");
                    this.logger.warn(childCtx.finish.warn(dictionary("app.domain.entities.routine.aborted", e?.message || String(e))));
                    this.#eventDispatcher(routineEvents.routineAborted);
                } else if (this.timeoutController?.timedout) {
                    this.logger.warn(childCtx.finish.warn(dictionary("app.domain.entities.routine.timedOut", e?.message || String(e))));
                    this.#eventDispatcher(routineEvents.routineTimeout);
                    this.#setStatus("timedout");
                } else {
                    this.#setStatus("failed");
                    this.logger.error(childCtx.finish.error(dictionary("app.domain.entities.routine.failed", e?.message || String(e))));
                    this.#eventDispatcher(routineEvents.routineFailed);
                }

                reject(e);
            } finally {
                userAbortSignal.removeEventListener("abort", handleOnAbortExecution);
                this.timeoutController?.clear()
                this.timeoutController?.removeAllListeners();
                cleanOnFinish();
                this.#resumeAutoCheckingConditions();
            }
        })
    }

    enable(): void {
        this.enabled = true;
        this.#eventDispatcher(routineEvents.routineEnabled);
    }

    disable(): void {
        this.enabled = false;
        this.stopAutoCheckingConditions();
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
            groupId: this.groupId,
            status: this.status,
            enabled: this.enabled,
            runInSync: this.runInSync,
            continueOnError: this.continueOnError,
            isRunning: this.isRunning,
            routineTimeout: this.routineTimeout,
            autoCheckConditionEveryMs: this.autoCheckConditionEveryMs,
            hidden: this.hidden,
            triggersId: this.triggerInstances.map(instance => ({ ...instance })),
            tasksId: this.taskInstances.map(instance => ({ ...instance }))
        }
    }

}
