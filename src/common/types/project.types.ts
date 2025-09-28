import { RoutineInterface, RoutineType } from "./routine.type";
import { TaskType } from "./task.type";
import { TriggerType } from "./trigger.type";

export type projectType = {
    id?: string; // Unique identifier for the project
    createdBy?: string; // User who created the project
    appVersion: string; // Version of the application that created the project
    name?: string; // Name of the project
    description?: string; // Optional description of the project
    createdAt?: Date; // Timestamp when the project was created
    updatedAt?: Date; // Timestamp when the project was last updated
    routines?: RoutineType[];
    triggers?: TriggerType[];
    tasks?: TaskType[];
    password?: string | null; // Optional password for the project
}


export interface projectInterface extends projectType {
    triggers?: TriggerType[];
    tasks?: TaskType[];
    setPassword: (password: string) => void; // Method to set the project password
    addRoutine: (routine: RoutineInterface) => void; // Method to add a routine to the project
    getRoutines: () => RoutineInterface[]; // Method to get all routines in the project
    removeRoutine: (routineId: string) => void; // Method to remove a routine
    getTrigger: (triggerId?: string) => TriggerType[]; // Method to get a trigger by ID
    getTask: (taskId?: string) => TaskType[]; // Method to get a task by ID
    toJson(): projectType; // Method to convert the project to a JSON representation
}