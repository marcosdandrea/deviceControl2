import { describe, expect, it } from "vitest";
import { Project } from ".";
import { Routine } from "../routine";
import { Task } from "../task";
import { WaitJob } from "../job/types/wait";
import { projectType } from "@common/types/project.types";
import App from "../app";

describe("Project Entity", () => {

    let savedProject: projectType

    it("should create a new project instance with valid properties", () => {

        const project = Project.createInstance({
            name: "Test Project",
            description: "A project for testing",
        })

        expect(project).toBeDefined();
        expect(project.name).toBe("Test Project");
        expect(project.description).toBe("A project for testing");
        expect(project.createdAt).toBeInstanceOf(Date);
        expect(project.updatedAt).toBeInstanceOf(Date);
        expect(project.id).toBeDefined();
        expect(project.routines).toEqual([]);
        expect(project.triggers).toEqual([]);
        expect(project.tasks).toEqual([]);

    })

    it("should throw an error if trying to create a second instance", () => {
        expect(() => {
            Project.createInstance({
                name: "Another Project",
                description: "This should fail",
            });
        }).toThrow("Project instance already exists. Use Project.getInstance() to access it.");
    })

    it("should retrieve the existing project instance", () => {
        const project = Project.getInstance();
        const existingProject = Project.getInstance();
        expect(existingProject).toBeDefined();
        expect(existingProject.id).toBe(project.id);
        expect(existingProject.name).toBe("Test Project");
    })

    it("should retrive null when getting an project instance before closing a project", () => {
        const project = Project.getInstance();
        project.close()
        expect(Project.getInstance()).toBe(null)
    })

    it("should allow re-creation of the project instance after closing", () => {
        const newProject = Project.createInstance({
            name: "Recreated Project",
            description: "This is a new instance after closing",
        })
        expect(newProject).toBeDefined();
        expect(newProject.name).toBe("Recreated Project");
        expect(newProject.description).toBe("This is a new instance after closing");
    })

    it("should create a routine and add it to the project", () => {
        const project = Project.getInstance();

        const routine = new Routine({
            name: "Test Routine",
            description: "A routine for testing",
        })

        project.addRoutine(routine)
        expect(project.routines).toContain(routine);
        expect(project.routines.length).toBe(1);
        expect(project.routines[0].name).toBe("Test Routine");
        expect(project.toJson()).toEqual({
            id: project.id,
            appVersion: App.getAppVersion(),
            name: project.name,
            description: project.description,
            createdAt: project.createdAt,
            updatedAt: project.updatedAt,
            routines: project.getRoutines().map(r => r.toJson()),
            triggers: project.triggers,
            tasks: project.tasks
        });
    })

    it("should add a task to the routine in the project", () => {
        const project = Project.getInstance();
        const routine = project.getRoutines()[0]

        const newTask = new Task({
            name: "Test Task",
            description: "A task for testing",
        })

        const waitJob = new WaitJob({
            name: "Wait Job",
            description: "A job that waits",
            timeout: 5000,
            enableTimoutWatcher: true,
        })

        newTask.setJob(waitJob);

        routine.addTask(newTask);

        const tasks = routine.getTasks();

        expect(tasks).toContain(newTask);
        expect(tasks.length).toBe(1);

    })

    it("should save the project and retrieve it correctly and close Instance", async () => {
        const project = Project.getInstance();
        savedProject = project.toJson();
        expect(savedProject).toBeDefined();
        expect(savedProject.name).toBe("Recreated Project");
        expect(savedProject.routines.length).toBe(1);
        expect(savedProject.routines[0].name).toBe("Test Routine");
        expect(savedProject.routines[0].tasksId?.length).toBe(1);
        expect(savedProject.routines[0].tasksId?.[0].taskId).toBe(project.tasks[0].id);

        project.close()
        expect(Project.getInstance()).toBeNull();
    })

})