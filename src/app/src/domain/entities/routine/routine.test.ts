import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import dgram from "dgram";
import { Routine } from ".";
import { SendUDPJob } from "../job/types/sendUDP";
import { Task } from "../task";

describe("Test Routine Entity", () => {

    let UDPmessages = []
    let UDPport = 3050;
    let UDPserver: dgram.Socket;

    let routine: Routine;

    beforeAll(() => {

        UDPserver = dgram.createSocket('udp4');
        UDPserver.on('message', (msg, rinfo) => {
            UDPmessages.push({
                message: msg.toString(),
                address: rinfo.address,
                port: rinfo.port
            });
        });
        
        UDPserver.bind(UDPport, "0.0.0.0", () => {
            console.log(`UDP server listening on port ${UDPport}`);
        });
        
    })

    afterAll(() => {
        UDPmessages = []
        UDPserver.close()
        console.log("UDP messages cleared")
    })

    beforeEach(() => {
        UDPmessages = [];
    });

    it("Should create a routine with a UDP job", async () => {
        routine = new Routine({
            name: "Test Routine",
            description: "Routine for testing UDP job"
        })

        const udpJob = new SendUDPJob({
            name: "Test UDP Job",
            description: "Job to send UDP messages",
            params: {
                subnetMask: "255.255.255.0",
                ipAddress: "127.0.0.1",
                portNumber: UDPport,
                message: "Hello, UDP!"
            }
        })

 
        const udpTask = new Task({
            name: "Test UDP Task",
            description: "Task to run UDP job"
        })

        udpTask.setJob(udpJob)

        routine.addTask(udpTask);
        routine.run()
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for the job to complete
        expect(UDPmessages.length).toBeGreaterThan(0);
        expect(UDPmessages[0].message).toBe("Hello, UDP!");
        
    })

    it("Should send 5 UDP messages in order in sync mode", async () => {
        routine = new Routine({
            name: "Routine UDP Sync",
            description: "Routine for ordered UDP test",
            runInSync: true
        });

        const messages = ["msg1", "msg2", "msg3", "msg4", "msg5"];
        messages.forEach((msg, idx) => {
            const udpJob = new SendUDPJob({
                name: `UDP Job ${idx+1}`,
                description: `Send ${msg}`,
                params: {
                    subnetMask: "255.255.255.0",
                    ipAddress: "127.0.0.1",
                    portNumber: UDPport,
                    message: msg
                }
            });
            const udpTask = new Task({
                name: `UDP Task ${idx+1}`,
                description: `Task for ${msg}`
            });
            udpTask.setJob(udpJob);
            routine.addTask(udpTask);
        });

        await routine.run();
        await new Promise(resolve => setTimeout(resolve, 1000));
        expect(UDPmessages.length).toBe(5);
        for (let i = 0; i < 5; i++) {
            expect(UDPmessages[i].message).toBe(`msg${i+1}`);
        }
    })

    it("Should send 5 UDP messages in parallel (order not guaranteed)", async () => {
        routine = new Routine({
            name: "Routine UDP Parallel",
            description: "Routine for parallel UDP test",
            runInSync: false
        });

        const messages = ["msg1", "msg2", "msg3", "msg4", "msg5"];
        messages.forEach((msg, idx) => {
            const udpJob = new SendUDPJob({
                name: `UDP Job ${idx+1}`,
                description: `Send ${msg}`,
                params: {
                    subnetMask: "255.255.255.0",
                    ipAddress: "127.0.0.1",
                    portNumber: UDPport,
                    message: msg
                }
            });
            const udpTask = new Task({
                name: `UDP Task ${idx+1}`,
                description: `Task for ${msg}`
            });
            udpTask.setJob(udpJob);
            routine.addTask(udpTask);
        });

        await routine.run();
        await new Promise(resolve => setTimeout(resolve, 1000));
        expect(UDPmessages.length).toBe(5);
        // En paralelo, el orden no está garantizado, pero todos los mensajes deben estar presentes
        const received = UDPmessages.map(m => m.message).sort();
        const expected = messages.slice().sort();
        expect(received).toEqual(expected);
    });
    
})


