import { Context } from "@src/domain/entities/context";
import { description, id, name } from "./commons.type";
import { TaskInterface, TaskType } from "./task.type";
import { TriggerInterface, TriggerType } from "./trigger.type";

type commonRoutineProps = {
    id?: id;
    name: name;
    description?: description;
    
    enabled: boolean;
    runInSync?: boolean;
    continueOnError?: boolean;
    routineTimeout?: number | false;
    hidden?: boolean;
    autoCheckConditionEveryMs?: number | false;

    isRunning?: boolean;
    status?: string;
    failed?: boolean;
}

export type TaskInstance = {
    id: id;
    taskId: id;
}

export type TriggerInstance = {
    id: id;
    triggerId: id;
}

export interface RoutineType extends commonRoutineProps {
    triggersId?: TriggerInstance[];
    tasksId?: TaskInstance[];
}

export interface RoutineInterface extends commonRoutineProps {
    triggers: TriggerInterface[];
    tasks: TaskInterface[];
    addTask: (task: TaskInterface, instanceId?: id) => void;
    removeTask: (taskId: id, instanceId?: id) => void;
    getTasks: () => TaskInterface[];
    swapTaskOrder: (taskId: id, newIndex: number) => void;
    addTrigger: (trigger: TriggerInterface, instanceId?: id) => void;
    removeTrigger: (triggerId: id, instanceId?: id) => void;
    getTriggers: () => TriggerInterface[];
    run: (triggeredBy: TriggerInterface, ctx: Context) => void;
    abort: (cause: string) => void;
    toJson: () => RoutineType;
}


export type RoutineStatus = "running" | "checking" | "completed" | "aborted" | "failed" | "unknown" | "timedout";