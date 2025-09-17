import { projectType } from "@common/types/project.types";

export const dummyProjectData =
    {
        id: "dummy-project",
        appVersion: "1.0.0",
        name: "Dummy Project",
        description: "This is a dummy project for testing purposes.",
        createdAt: new Date("2024-01-01T00:00:00Z"),
        updatedAt: new Date("2024-01-01T00:00:00Z"),
        password: "",
        routines: [
            {
                id: "routine-1",
                name: "Routine 1",
                description: "This is a dummy routine for testing purposes.",
                tasksId: [
                    { id: "routine-1-task-1", taskId: "task-1" }
                ],
                triggersId: [
                    { id: "routine-1-trigger-1", triggerId: "apiTrigger-1" }
                ],
                routineTimeout: 90000,
                enabled: true,
                autoCheckConditionEveryMs: false
            },
            {
                id: "routine-2",
                name: "Routine 2",
                description: "This routine will trigger when routine 1 is completed.",
                tasksId: [
                    { id: "routine-2-task-1", taskId: "task-1" }
                ],
                triggersId: [
                    { id: "routine-2-trigger-1", triggerId: "routineEventTrigger-1" }
                ],
                enabled: true,
            },
            {
                id: "routine-3",
                name: "Routine 3",
                description: "This routine will trigger when routine 1 is aborted.",
                tasksId: [
                    { id: "routine-3-task-1", taskId: "task-0" }
                ],
                triggersId: [
                    { id: "routine-3-trigger-1", triggerId: "routineEventTrigger-2" }
                ],
                enabled: true,
            },
            {
                id: "routine-4",
                name: "Routine 4",
                description: "This routine will trigger if routine 1 fails.",
                tasksId: [
                    { id: "routine-4-task-1", taskId: "task-0" }
                ],
                triggersId: [
                    { id: "routine-4-trigger-1", triggerId: "routineEventTrigger-3" }
                ],
                enabled: true,
            }
        ],
        triggers: [
            {
                id: "apiTrigger-1",
                type: "api",
                name: "API Trigger 1",
                reArmOnTrigger: true,
                description: "This is a dummy API trigger for testing purposes.",
                params: {
                    endpoint: "/api/dummy-endpoint",
                }
            },
            {
                id: "routineEventTrigger-1",
                type: "onRoutineEvent",
                name: "Routine Event Trigger 1",
                reArmOnTrigger: true,
                description: "This is a dummy routine event trigger for testing purposes.",
                params: {
                    routineId: "routine-1",
                    routineEvent: "routine:completed"
                }
            },
            {
                id: "routineEventTrigger-2",
                type: "onRoutineEvent",
                name: "Routine Event Trigger 2",
                reArmOnTrigger: true,
                description: "This is a dummy routine event trigger for testing purposes.",
                params: {
                    routineId: "routine-1",
                    routineEvent: "routine:aborted"
                }
            },
            {
                id: "routineEventTrigger-3",
                type: "onRoutineEvent",
                name: "Routine Event Trigger 3",
                reArmOnTrigger: true,
                description: "This is a dummy routine event trigger for testing purposes.",
                params: {
                    routineId: "routine-1",
                    routineEvent: "routine:failed"
                }
            }
        ],
        tasks: [
            {
                id: "task-0",
                name: "Task 0",
                description: "This is a dummy task for testing purposes. It just waits 5 seconds.",
                job: {
                    id: "job-0",
                    name: "Wait",
                    type: "waitJob",
                    params: {
                        time: 5000
                    }
                }
            },
            {
                id: "task-1",
                name: "Task 1",
                description: "Waits 5000 seconds and sends UDP and expects a response",
                retries: 3,
                waitBeforeRetry: 15000,
                job: {
                    id: "job-1",
                    name: "Wait",
                    type: "waitJob",
                    params: {
                        time: 5000
                    }
                },
                condition: {
                    id: "condition-1",
                    name: "Wait for UDP Response",
                    type: "udpAnswer",
                    timeoutValue: 10000,
                    description: "Waits for a UDP response",
                    params: {
                        ip: "127.0.0.1",
                        port: 12345,
                        message: "Hello",
                        answer: "Hi"
                    }
                }
            }
        ],
    } as projectType;