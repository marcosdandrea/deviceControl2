import { describe, expect, it, vi } from "vitest";

import jobTypes from "@entities/job/types/index";
import { Task } from ".";
import taskEvents from "@common/events/task.events";
const { SendUDPJob } = jobTypes.sendUDPJob


describe("Test Task Entity", () => {
    const HOST = "127.0.0.1";
    const PORT = 3050;

    it("Should create a task with a SendUDPJob as Job and test it", async () => {
        const server = require('dgram').createSocket('udp4');

        const udpMessagePromise = new Promise<string>((resolve) => {
            server.on('message', (msg) => {
                const message = msg.toString();
                resolve(message);
            });
        });

        await new Promise(resolve => server.bind(PORT, HOST, resolve));

        const newTask = new Task({
            name: "Test UDP Task"
        });

        const sendUDPJob = new SendUDPJob({
            name: "Test UDP Job",
            params: {
                serverIP: HOST,
                serverPort: PORT,
                message: "Hello, UDP!"
            }
        })

        newTask.setJob(sendUDPJob)

        const taskRunningPromise = new Promise<void>((resolve) => {
            newTask.on(taskEvents.taskRunning, (taskId, taskName) => {
                expect(taskId).toBe(newTask.id);
                expect(taskName).toBe(newTask.name);
                resolve();
            })
        })

        const taskCompletedPromise = new Promise<void>((resolve) => {
            newTask.on(taskEvents.taskCompleted, async () => {
                const udpMessage = await udpMessagePromise;
                expect(udpMessage).toBe("Hello, UDP!");
                expect(newTask.failed).toBe(false);
                expect(newTask.aborted).toBe(false);
                resolve();
            });
        });

        await newTask.run({ abortSignal: new AbortController().signal });

        await Promise.all([
            taskRunningPromise,
            taskCompletedPromise
        ]);

        server.close();
    })
    
    it("Should create a task with a SendUDPJob and abort it before execution", async () => {
        const server = require('dgram').createSocket('udp4');
        await new Promise(resolve => server.bind(PORT, HOST, resolve));

        const newTask = new Task({
            name: "Test UDP Task"
        });

        const sendUDPJob = new SendUDPJob({
            name: "Test UDP Job",
            params: {
                serverIP: HOST,
                serverPort: PORT,
                message: "Hello, UDP!"
            }
        });

        newTask.setJob(sendUDPJob);

        const taskRunningPromise = new Promise<void>((resolve) => {
            newTask.on(taskEvents.taskRunning, (taskId, taskName) => {
                expect(taskId).toBe(newTask.id);
                expect(taskName).toBe(newTask.name);
                resolve();
            });
        });

        const taskAbortedPromise = new Promise<void>((resolve) => {
            newTask.on(taskEvents.taskAborted, ({taskId, taskName}) => {
                expect(taskId).toBe(newTask.id);
                expect(taskName).toBe(newTask.name);
                expect(newTask.aborted).toBe(true);
                resolve();
            });
        });

        const onTaskCompleted = vi.fn()
        newTask.on(taskEvents.taskCompleted, onTaskCompleted);

        const abortController = new AbortController();
        abortController.abort()

        try {
            await newTask.run({ abortSignal: abortController.signal });
        } catch (error) {
            expect(error.message).toBe(`Task "${newTask.name}" aborted`);
        }


        await Promise.all([
            taskRunningPromise,
            taskAbortedPromise
        ])

        expect(onTaskCompleted).not.toHaveBeenCalled();

        server.close();
    });

    it("Should create a task with a SendUDPJob, abort execution and then retry without aborting", async () => {
        const server = require('dgram').createSocket('udp4');
        await new Promise(resolve => server.bind(PORT, HOST, resolve));

        const newTask = new Task({
            name: "Test UDP Task",
            retries: 1,
            checkConditionBeforeExecution: true
        });

        const sendUDPJob = new SendUDPJob({
            name: "Test UDP Job",
            params: {
                serverIP: HOST,
                serverPort: PORT,
                message: "Hello, UDP!"
            }
        });

        newTask.setJob(sendUDPJob);

        const taskRunningPromise = new Promise<void>((resolve) => {
            newTask.on(taskEvents.taskRunning, (taskId, taskName) => {
                expect(taskId).toBe(newTask.id);
                expect(taskName).toBe(newTask.name);
                resolve();
            });
        });

        const taskAbortedPromise = new Promise<void>((resolve) => {
            newTask.on(taskEvents.taskAborted, ({taskId, taskName}) => {
                expect(taskId).toBe(newTask.id);
                expect(taskName).toBe(newTask.name);
                expect(newTask.aborted).toBe(true);
                resolve();
            });
        });

        const taskCompletedPromise = new Promise<void>((resolve) => {
            newTask.on(taskEvents.taskCompleted, () => {
                expect(newTask.failed).toBe(false);
                expect(newTask.aborted).toBe(false);
                resolve();
            });
        });

        const abortController = new AbortController();
        abortController.abort();

        try {
            await newTask.run({ abortSignal: abortController.signal });
        } catch (error) {
            expect(error.message).toBe(`Task "${newTask.name}" aborted`);
        }

        await Promise.all([
            taskRunningPromise,
            taskAbortedPromise
        ]);

        // Now retry without aborting
        await newTask.run({ abortSignal: new AbortController().signal });

        await taskCompletedPromise;

        server.close();
    });

});
