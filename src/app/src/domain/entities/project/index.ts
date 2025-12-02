import projectEvents from "@common/events/project.events";
import { GroupType, id } from "@common/types/commons.type";
import { projectInterface as ProjectInterface, projectType } from "@common/types/project.types";
import { TaskInterface } from "@common/types/task.type";
import { TriggerInterface } from "@common/types/trigger.type";
import { Log } from "@src/utils/log";
import { EventEmitter } from "events";
import { Routine } from "../routine";
import { Trigger } from "../trigger";
import { Task } from "../task";
import App from "../app";
import { ServerManager } from "@src/services/server/serverManager";
import {removeRoutine} from "@useCases/routine"
import { nanoid } from "nanoid";


export interface ProjectConstructor {
    appVersion?: string;
    id?: string; // Unique identifier for the project
    name?: string;
    description?: string;
    groups: GroupType[]; // array of groups associated with the project
    createdBy?: string;
    createdAt?: Date; // Timestamp when the project was created
    updatedAt?: Date; // Timestamp when the project was last updated
    routines?: Routine[];
    triggers?: Trigger[];
    tasks?: Task[];
    filePath?: string; // Optional file path for the project
    password?: string | null; // Optional password for the project
    showGroupsInControlView: boolean; // Flag to show groups in control view
}

export class Project extends EventEmitter implements ProjectInterface {

    id: string;
    appVersion: string;
    createdBy: string;
    name: string;
    groups: GroupType[]; // array of groups associated with the project
    description: string;
    createdAt: Date;
    updatedAt: Date;
    routines: Routine[];
    triggers: Trigger[];
    tasks: Task[];
    filePath?: string; // Optional file path for the project
    password?: string | null;
    showGroupsInControlView: boolean;

    private static readonly appVersion: string = App.getAppVersion()
    private unsavedChanges: boolean = false; // Flag to track unsaved changes
    private static Instance: Project | null = null; // Singleton instance

    logger: Log

    private _anyListeners: Function[];


    constructor(props: ProjectConstructor) {

        if (Project.Instance) {
            throw new Error("Project instance already exists. Use Project.getInstance() to access it.");
        }

        super();
        this._anyListeners = [];
        this.id = props?.id || crypto.randomUUID(); // Generate a unique ID if not provided
        this.name = props?.name || "New Project";
        this.filePath = props?.filePath || null; // Optional file path for the project
        this.description = props?.description || "";
        this.appVersion = props?.appVersion || Project.appVersion;
        this.createdBy = props?.createdBy || "Unknown";
        this.createdAt = props?.createdAt || new Date();
        this.updatedAt = props?.updatedAt || new Date();
        this.routines = props.routines || [];
        this.groups = props.groups || [{ id: nanoid(9), name: "ungrouped" }];
        this.triggers = props.triggers || []; // Replace 'any' with actual TriggerType
        this.tasks = props.tasks || []; // Replace 'any' with actual TaskType
        this.password = props.password || null;
        this.logger = Log.createInstance(`Project "${this.name}" (${this.id})`, true);
        this.showGroupsInControlView = props.showGroupsInControlView || false;

        this.logger.info("Project instance created");

        Project.Instance = this; // Set the singleton instance
    }

    setPassword(password: string) {
        this.password = password;
    }

    static getInstance(): Project {
        if (!Project.Instance)
            return null

        return Project.Instance;
    }

    static createInstance(props?: ProjectConstructor): Project {
        if (Project.Instance)
            throw new Error("Project instance already exists. Use Project.getInstance() to access it.");

        const project = new Project(props);
        project.logger.info("New project instance created");
        project.dispatchEvent(projectEvents.created, project);
        return project;
    }

    static close(): void {
        if (!Project.Instance)
            return null;

        const generalServer = ServerManager.getInstance("general")
        generalServer.unbindAllRoutes();

        // Si los objetos (rutinas, triggers y tasks) tienen listeners internos,
        // se limpia cada uno para eliminar referencias y ayudar al recolector de basura.
        Project.Instance.routines.forEach(routine => {
            routine.stopAutoCheckingConditions();
            routine.removeAllListeners();
            removeRoutine(routine.id);
        });
        // Eliminar cada rutina explícitamente para ayudar a liberar memoria
        Project.Instance.routines.length = 0;

        Project.Instance.triggers.forEach(trigger => {
            trigger.removeAllListeners()
        });
        Project.Instance.triggers.length = 0;

        Project.Instance.tasks.forEach(task => {
            task.removeAllListeners();
            task.condition = null;
            task.job = null;
        });
        Project.Instance.tasks.length = 0;

        // Disparar evento de cierre para notificar a otros componentes
        Project.Instance.dispatchEvent(projectEvents.closed);
        Project.Instance.logger.info("Project instance closed");
        Project.Instance.removeAllListeners(); // Limpia los listeners del proyecto
        Project.Instance = null; // Elimina la referencia al singleton

        return null;
    }

    onAny(listener) {
        this._anyListeners.push(listener);
        return this;
    }

    offAny(listener) {
        this._anyListeners = this._anyListeners.filter(l => l !== listener);
        return this;
    }

    protected dispatchEvent(eventName: string, payload?: any): void {
        if (!eventName || typeof eventName !== "string")
            throw new Error("Event name must be a valid string");
        this.emit(eventName, payload);
        for (const listener of this._anyListeners) {
            try {
                listener(eventName, payload);
            } catch (err) {
                this.emit('error', err);
            }
        }
    }

    setName(name: string): void {
        if (!name || typeof name !== "string") {
            throw new Error("Project name must be a valid string");
        }
        this.name = name;
        this.updatedAt = new Date();
        this.logger.info(`Project name set to "${this.name}"`);
        this.dispatchEvent(projectEvents.nameChanged, this.name);
    }

    getTrigger(triggerId?: id): TriggerInterface[] {
        const triggers = {}
        this.routines.forEach((routine) => {
            if (routine.triggers) {
                routine.triggers.forEach((trigger) => {
                    triggers[trigger.id] = trigger;
                });
            }
        })

        if (triggerId) {
            return triggers[triggerId] ? [triggers[triggerId]] : [];
        } else {
            return Object.values(triggers);
        }
    }

    getTask(taskId?: id): TaskInterface[] {
        const tasks = {};
        this.routines.forEach((routine) => {
            if (routine.tasks) {
                routine.tasks.forEach((task) => {
                    tasks[task.id] = task;
                });
            }
        });

        if (taskId) {
            return tasks[taskId] ? [tasks[taskId]] : [];
        } else {
            return Object.values(tasks);
        }
    }

    addRoutine(routine: Routine): void {
        if (!routine || !routine.id)
            throw new Error("Routine must have a valid ID");

        this.routines.push(routine);
        this.logger.info(`Routine "${routine.name}" added to project "${this.name}"`);
        this.updatedAt = new Date();
        this.dispatchEvent(projectEvents.routineAdded, routine);
    }

    getRoutines(routineId?: id): Routine[] {
        if (!routineId) {
            this.logger.warn(`Routine ID is required to retrieve a routine from project "${this.name}"`);
            return this.routines
        }

        const routine = this.routines.find(r => r.id === routineId);
        if (!routine) {
            this.logger.warn(`Routine with ID ${routineId} not found in project "${this.name}"`);
            return undefined;
        }
        this.logger.info(`Routine "${routine.name}" retrieved from project "${this.name}"`);
        return [routine];
    }

    removeRoutine(routineId: id): void {
        const index = this.routines.findIndex(r => r.id === routineId);
        if (index === -1)
            throw new Error(`Routine with ID ${routineId} not found`);

        const removedRoutine = this.routines.splice(index, 1)[0];
        this.logger.info(`Routine "${removedRoutine.name}" removed from project "${this.name}"`);
        this.updatedAt = new Date();
        this.dispatchEvent(projectEvents.routineRemoved, removedRoutine);
    }

    setUnsavedChanges(value: boolean): void {
        if (typeof value !== "boolean") {
            throw new Error("Unsaved changes flag must be a boolean");
        }
        this.unsavedChanges = value;
    }

    hasUnsavedChanges(): boolean {
        return this.unsavedChanges;
    }

    toJson(): projectType {
        return {
            id: this.id,
            appVersion: Project.appVersion,
            name: this.name,
            description: this.description,
            createdBy: this.createdBy,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
            password: this.password,
            groups: this.groups,
            showGroupsInControlView: this.showGroupsInControlView,
            routines: this.routines.map(routine => routine.toJson()),
            triggers: this.getTrigger().map(trigger => trigger.toJson()),
            tasks: this.getTask().map(task => task.toJson())
        };
    }
}