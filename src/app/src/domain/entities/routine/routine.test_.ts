import { describe, expect, it, vi } from "vitest";
import { Routine } from ".";
import { SendUDPJob } from "../job/types/sendUDP";
import { WaitJob } from "../job/types/wait";
import { Task } from "../task";
import routineEvents from "@common/events/routine.events";

describe("Test Routine Entity", () => {

    let routine: Routine;

    it("Should create a routine and test its properties", () => {
        routine = new Routine({
            name: "Test Routine",
            description: "This is a test routine",
            tasks: []
        })

        expect(routine.name).toBe("Test Routine");
        expect(routine.description).toBe("This is a test routine");
        expect(routine.enabled).toBe(true);
        expect(routine.runInSync).toBe(false);
        expect(routine.continueOnError).toBe(true);
    });

    it("Should add a task with a SendUDPJob to the routine", () => {

        const task = new Task({
            name: "Test UDP Task"
        });

        const newJob = new SendUDPJob({
            name: "Test UDP Job",
            params: {
                serverIP: "127.0.0.1",
                serverPort: 3050,
                message: "Hello, UDP!"
            }
        });

        task.setJob(newJob);
        routine.addTask(task);
        const tasks = routine.getTasks();
        expect(tasks.length).toBe(1);
        expect(tasks[0].name).toBe("Test UDP Task");
        expect(tasks[0].job.name).toBe("Test UDP Job");

    });

    it("Should run the routine and check task execution", async () => {
        const server = require('dgram').createSocket('udp4');

        const udpMessagePromise = new Promise<string>((resolve) => {
            server.on('message', (msg) => {
                const message = msg.toString();
                resolve(message);
            });
        });

        await new Promise(resolve => server.bind(3050, "0.0.0.0", resolve));
        const routineRunning = new Promise<void>((resolve) => {
            routine.on(routineEvents.routineRunning, ({ routineId }) => {
                expect(routineId).toBe(routine.id);
                resolve();
            });
        });

        const routineCompleted = new Promise<void>((resolve) => {
            routine.on(routineEvents.routineCompleted, async ({ routineId }) => {
                const udpMessage = await udpMessagePromise;
                expect(udpMessage).toBe("Hello, UDP!");
                resolve();
            });
        });

        await routine.run();
        await Promise.all([routineRunning, routineCompleted]);
        server.close();
        expect(routine.isRunning).toBe(false);
        expect(routine.getTasks()[0].failed).toBe(false);
        expect(routine.getTasks()[0].aborted).toBe(false);
        expect(routine.getTasks()[0].job).toBeDefined();
        expect(routine.getTasks()[0].job.name).toBe("Test UDP Job");
    })

    it("Should change routine execution to run in sync and test its execution", () => {
        let udpMessages: string[] = [];

        routine.setExecutionModeInSync(true);
        expect(routine.runInSync).toBe(true);

        const task = new Task({
            name: "Test Sync Task"
        });

        const newJob = new SendUDPJob({
            name: "Test Sync Job",
            params: {
                serverIP: "127.0.0.1",
                serverPort: 3050,
                message: "Hello, Sync UDP!"
            }
        });

        task.setJob(newJob);
        routine.addTask(task);

        const server = require("dgram").createSocket("udp4");

        const udpMessagesPromise = new Promise<void>((resolveUDP) => {
            server.on("message", (msg) => {
                const message = msg.toString();
                console.log(`Received message: ${message}`);
                udpMessages.push(message);
                if (udpMessages.length === 2) {
                    resolveUDP();
                }
            });
        });

        return new Promise<void>((resolveTest) => {
            server.bind(3050, "0.0.0.0", async () => {
                const routineRunning = new Promise<void>((resolveRunning) => {
                    routine.on(routineEvents.routineRunning, ({ routineId }) => {
                        expect(routineId).toBe(routine.id);
                        resolveRunning();
                    });
                });

                const routineCompleted = new Promise<void>((resolveCompleted) => {
                    routine.on(routineEvents.routineCompleted, () => {
                        resolveCompleted();
                    });
                });

                await routine.run();
                await Promise.all([routineRunning, routineCompleted, udpMessagesPromise]);

                // Ahora sí es seguro verificar los mensajes
                expect(udpMessages[0]).toBe("Hello, UDP!");
                expect(udpMessages[1]).toBe("Hello, Sync UDP!");

                server.close();

                // Verificaciones finales de estado
                expect(routine.isRunning).toBe(false);
                const tasks = routine.getTasks();
                expect(tasks[1].failed).toBe(false);
                expect(tasks[1].aborted).toBe(false);
                expect(tasks[1].job).toBeDefined();
                expect(tasks[1].job.name).toBe("Test Sync Job");

                resolveTest();
            });
        });
    });

    //aumenta el timeout del test temporalmente para evitar problemas de timeout
    vi.setConfig({ testTimeout: 60000 });

    it("Should remove all previous tasks and add 10 jobs and check their executions in sync mode", async () => {
        routine.removeAllTasks();
        expect(routine.getTasks().length).toBe(0);

        for (let i = 0; i < 10; i++) {
            const task = new Task({
                name: `Test Task ${i + 1}`
            });

            const newJob = new WaitJob({
                name: `Test Wait Job ${i + 1}`,
                params: {
                    time: 100 * (i + 1) // Incremental wait time
                }
            });

            task.setJob(newJob);
            routine.addTask(task)
        }

        expect(routine.getTasks().length).toBe(10);

        routine.runInSync = true;
        expect(routine.runInSync).toBe(true);

        const routineRunning = new Promise<void>((resolveRunning) => {
            routine.on(routineEvents.routineRunning, ({ routineId }) => {
                expect(routineId).toBe(routine.id);
                resolveRunning();
            });
        });

        const routineCompleted = new Promise<void>((resolveCompleted) => {
            routine.on(routineEvents.routineCompleted, () => {
                resolveCompleted();
            });
        });

        await routine.run();
        await Promise.all([routineRunning, routineCompleted]);

        expect(routine.isRunning).toBe(false);
        const tasks = routine.getTasks();
        tasks.forEach((task, index) => {
            expect(task.job.name).toBe(`Test Wait Job ${index + 1}`);
            expect(task.failed).toBe(false);
            expect(task.aborted).toBe(false);
        });
    })

    vi.setConfig({ testTimeout: 5000 });

    it ("Should run the same routine in async mode and check its execution", async () => {
        routine.setExecutionModeInSync(false);
        expect(routine.runInSync).toBe(false);

        const routineRunning = new Promise<void>((resolveRunning) => {
            routine.on(routineEvents.routineRunning, ({ routineId }) => {
                expect(routineId).toBe(routine.id);
                resolveRunning();
            });
        });

        const routineCompleted = new Promise<void>((resolveCompleted) => {
            routine.on(routineEvents.routineCompleted, () => {
                resolveCompleted();
            });
        });

        await routine.run();
        await Promise.all([routineRunning, routineCompleted]);

        expect(routine.isRunning).toBe(false);
        const tasks = routine.getTasks();
        tasks.forEach((task, index) => {
            expect(task.job.name).toBe(`Test Wait Job ${index + 1}`);
            expect(task.failed).toBe(false);
            expect(task.aborted).toBe(false);
        });
    });

});