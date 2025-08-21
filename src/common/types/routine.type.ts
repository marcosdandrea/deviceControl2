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
    isRunning?: boolean;
    hidden?: boolean;
    status?: string;
    failed?: boolean;
    autoCheckConditionEveryMs?: number | false;
}

export interface RoutineType extends commonRoutineProps {
    triggersId?: string[];
    tasksId?: string[];
}

export interface RoutineInterface extends commonRoutineProps {
    triggers: TriggerInterface[];
    tasks: TaskInterface[];
    addTask: (task: TaskInterface) => void;
    removeTask: (taskId: id) => void;
    getTasks: () => TaskInterface[];
    swapTaskOrder: (taskId: id, newIndex: number) => void;
    addTrigger: (trigger: TriggerInterface) => void;
    removeTrigger: (triggerId: id) => void;
    getTriggers: () => TriggerInterface[];
    run: () => void;
    abort: (cause: string) => void;
    toJson: () => RoutineType;
}

export type RoutineStatus = "running" | "checking" | "completed" | "aborted" | "failed" | "unknown";