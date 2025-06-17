import { description, id, name } from "./commons.type";
import { TaskInterface, TaskType } from "./task.type";
import { TriggerInterface, TriggerType } from "./trigger.type";

type commonRoutineProps = {
    id?: id;
    name: name;
    description?: description;
    enabled?: boolean;
    runInSync?: boolean;
    continueOnError?: boolean;
    taskTimeout?: number | false;
    isRunning?: boolean;
    hidden?: boolean;
}

export interface RoutineType extends commonRoutineProps {
    triggers?: TriggerType[];
    tasks?: TaskType[];
}

export interface RoutineInterface extends commonRoutineProps {
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