import { describe, it, expect, beforeAll, vi } from "vitest";
import { SendTCPJob } from ".";

describe("sendTCP Job tests", () => {

    let tcpPackets = []

    //creates a tcp server for testing
    beforeAll(() => {
        tcpPackets = [];
        const net = require('net');
        const server = net.createServer((socket) => {
            socket.on('data', (data) => {
                const packet = data.toString();
                tcpPackets.push(packet);
                console.log(`Received packet: ${packet}`)
                // Respond to the client if needed
                socket.write("Acknowledged");
            });
        });

        return new Promise<void>((resolve) => {
            server.listen(8080, '127.0.0.1', () => {
                console.log("TCP server is running");
                resolve();
            });
        });
    });

    
    it("should send a TCP packet successfully", async () => {
        const sendUDPJob = new SendTCPJob({
            id: "test-job",
            name: "Test TCP Job",
            params: {
                ipAddress: "127.0.0.1",
                portNumber: 8080,
                message: "Hello, World!"
            }
        });

        const abortController = new AbortController();
        const abortSignal = abortController.signal;
        
        await sendUDPJob.execute({ abortSignal });
        await new Promise((res) => setTimeout(res, 100)); // espera a que el server reciba el paquete
        expect(tcpPackets[0]).toBe("Hello, World!");

    });

    it("should throw an error for invalid parameters", async () => {
        const sendUDPJob = new SendTCPJob({
            id: "test-job-invalid",
            name: "Test TCP Job Invalid",
            params: {
                ipAddress: "invalid-ip",
                portNumber: 8080,
                message: "This should fail"
            }
        });
        const abortController = new AbortController();
        const abortSignal = abortController.signal;
        await expect(sendUDPJob.execute({abortSignal})).rejects.toThrow("Ip Address must be a valid IPv4 address");
    });

    it("should throw an error if 'ipAddress' parameter is missing", async () => {
        const sendUDPJob = new SendTCPJob({
            id: "test-job-missing-ip",
            name: "Test TCP Job Missing IP",
            params: {
                portNumber: 8080,
                message: "This message will not be sent"
            }
        });

        const abortController = new AbortController();
        const abortSignal = abortController.signal;

        await expect(sendUDPJob.execute({abortSignal})).rejects.toThrow("Missing required parameters: ipAddress");
    });

    it("should throw an error if 'portNumber' parameter is missing", async () => {
        const sendUDPJob = new SendTCPJob({
            id: "test-job-missing-port",
            name: "Test TCP Job Missing Port",
            params: {
                ipAddress: "127.0.0.1",
                message: "This message will not be sent"
            }
        });

        const abortController = new AbortController();
        const abortSignal = abortController.signal;

        await expect(sendUDPJob.execute({abortSignal})).rejects.toThrow("Missing required parameters: portNumber");
    })

    it("should throw an error if 'portNumber' is out of range", async () => {
        const sendUDPJob = new SendTCPJob({
            id: "test-job-invalid-port",
            name: "Test TCP Job Invalid Port",
            params: {
                ipAddress: "127.0.0.1",
                portNumber: 70000, // Invalid port
                message: "This message will not be sent"
            }
        })

        const abortController = new AbortController();
        const abortSignal = abortController.signal;
        await expect(sendUDPJob.execute({abortSignal})).rejects.toThrow("Port Number must be a number between 0 and 65535");
    });

    it("should throw an error if 'message' parameter is missing", async () => {
        const sendUDPJob = new SendTCPJob({
            id: "test-job-missing-message",
            name: "Test TCP Job Missing Message",
            params: {
                ipAddress: "127.0.0.1",
                portNumber: 8080,
                // message is missing
            }
        });

        const abortController = new AbortController();
        const abortSignal = abortController.signal;
        await expect(sendUDPJob.execute({abortSignal})).rejects.toThrow("Missing required parameters: message");
    });

    it("should handle job cancellation", async () => {
        const sendUDPJob = new SendTCPJob({
            id: "test-job-cancel",
            name: "Test TCP Job Cancel",
            params: {
                ipAddress: "127.0.0.1",
                portNumber: 8080,
                message: "This message will not be sent"
            }
        });
        const abortController = new AbortController();
        const abortSignal = abortController.signal;
        abortController.abort(); // Cancela el job inmediatamente

        try{
            await sendUDPJob.execute({ abortSignal });
        } catch (error) {
            expect(error.message).toBe(`Job "${sendUDPJob.name}" was aborted before execution`);
        }

    });

    it("should send a TCP packet and wait for an answer", async () => {
        tcpPackets = []; // Resetea los paquetes recibidos
        const sendUDPJob = new SendTCPJob({
            id: "test-job-wait-answer",
            name: "Test TCP Job Wait Answer",
            params: {
                ipAddress: "127.0.0.1",
                portNumber: 8080,
                message: "Hello, World!",
                answer: "Acknowledged"
            }
        });

        const abortController = new AbortController();
        const abortSignal = abortController.signal;

        await sendUDPJob.execute({ abortSignal });
        await new Promise((res) => setTimeout(res, 100)); // espera a que el server reciba el paquete
        expect(tcpPackets[0]).toBe("Hello, World!");
    });

    it("should send a TCP packet to a not existing server and throw an error", async () => {
        const sendUDPJob = new SendTCPJob({
            id: "test-job-non-existing-server",
            name: "Test TCP Job Non Existing Server",
            params: {
                ipAddress: "127.0.0.2",
                portNumber: 8080,
                message: "This message will not be sent",
            }
        });

        const abortController = new AbortController();
        const abortSignal = abortController.signal;

        await expect(sendUDPJob.execute({abortSignal})).rejects.toThrow(`Failed to send TCP packet: connect ECONNREFUSED ${sendUDPJob.params.ipAddress}:${sendUDPJob.params.portNumber}`);
    })

    vi.setConfig({testTimeout: 10000})

    it("should send a TCP packet and wait for an answer that will never come and run into timeout", async () => {
        tcpPackets = []; // Resetea los paquetes recibidos
        const sendUDPJob = new SendTCPJob({
            id: "test-job-wait-answer-never",
            name: "Test TCP Job Wait Answer Never",
            params: {
                ipAddress: "127.0.0.1",
                portNumber: 8080,
                message: "Hello, World!",
                answer: "This answer will never come"
            }
        })

        try{
            await sendUDPJob.execute({abortSignal: new AbortController().signal});

        }catch (error) {
            expect(error.message).toBe(`Job "${sendUDPJob.name}" timed out after 5000 ms`);
        }
    })
    
})