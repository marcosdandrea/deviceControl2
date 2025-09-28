import { JobType, requiredJobParamType } from "@common/types/job.type";
import { Job } from "../..";
import jobEvents from "@common/events/job.events";
import dgram from 'dgram';
import { jobTypes } from "..";
import ip from "ip";
import { Context } from "@src/domain/entities/context";
import dictionary from "@common/i18n";

export interface SendUDPJobType extends JobType {
    params: {
        ipAddress: string;
        portNumber: number;
        message: string | Buffer; 
        subnetMask?: string; // Optional, used for broadcast detection
    }
}


export class SendUDPJob extends Job {
    static description = "Sends a UDP packet to a specified IP address and port.";
    static name = "Enviar paquete UDP";
    static type = jobTypes.sendUDPJob;

    constructor(options: SendUDPJobType) {
        super({
            ...options,
            timeout: 5000, // Default timeout of 5 seconds
            enableTimoutWatcher: false,
            type: jobTypes.sendUDPJob
        });
        
        this.validateParams();
    }

    requiredParams(): requiredJobParamType[] {
        return [{
            name: "ipAddress",
            type: "string",
            validationMask: "^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$",
            description: "Target IPv4 address",
            required: true
        },
        {
            name: "portNumber",
            type: "number",
            validationMask: "^(\\d{1,5})$",
            description: "Target port number (0-65535)",
            required: true
        },
        {
            name: "message",
            type: "string",
            validationMask: "^[\\s\\S]+$",
            description: "Message to send",
            required: true
        }
    ];
    }

    async job(ctx: Context): Promise<void> {
        this.failed = false;
        const { signal: abortSignal } = this.abortController || {};
        const displayName = this.name || this.id;
        ctx.log.info(dictionary("app.domain.entities.job.sendUdp.starting", displayName));
        this.log.info(dictionary("app.domain.entities.job.sendUdp.starting", displayName));

        let ipAddress, portNumber, message, subnetMask;

        try {
            ({ ipAddress, portNumber, message, subnetMask } = this.params);
        } catch (error) {
            this.failed = true;
            this.dispatchEvent(jobEvents.jobError, { jobId: this.id, error });
            throw error;
        }

        const isBroadcast = (ipAddr: string, subnetMask?: string): boolean => {
            if (ipAddr === "255.255.255.255") return true;
            if (!subnetMask) return false;
            try {
                const subnetInfo = ip.subnet(ipAddr, subnetMask);
                return ipAddr === subnetInfo.broadcastAddress;
            } catch {
                return false;
            }
        };

        const client = dgram.createSocket('udp4');

        if (isBroadcast(ipAddress, subnetMask)) {
            this.log.info(dictionary("app.domain.entities.job.sendUdp.sendingToBroadcast", ipAddress, portNumber));
            ctx.log.info(dictionary("app.domain.entities.job.sendUdp.sendingToBroadcast", ipAddress, portNumber));
            client.bind(() => {
                client.setBroadcast(true);
            });
        }

        return new Promise<void>((resolve, reject) => {
            let finished = false;

            const safeResolve = () => {
                if (!finished) {
                    finished = true;
                    client.close();
                    resolve();
                }
            };

            const safeReject = (err: Error) => {
                if (!finished) {
                    finished = true;
                    client.close();
                    if (err.message.includes('was aborted')) {
                        this.log.warn(err.message);
                        ctx.log.warn(err.message);
                    } else {
                        this.failed = true;
                        this.dispatchEvent(jobEvents.jobError, { jobId: this.id, error: err });
                    }
                    reject(err);
                }
            };

            const messageBuffer = Buffer.from(message, 'utf-8');

            client.send(messageBuffer, 0, messageBuffer.length, portNumber, ipAddress, (err) => {
                if (err) {
                    this.log.error(dictionary("app.domain.entities.job.sendUdp.failed", err.message));
                    ctx.log.error(dictionary("app.domain.entities.job.sendUdp.failed", err.message));
                    return safeReject(err);
                }
                ctx.log.info(dictionary("app.domain.entities.job.sendUdp.sent", message, ipAddress, portNumber));
                safeResolve();
            });

            if (abortSignal) {
                abortSignal.addEventListener("abort", () => {
                    safeReject(new Error(`Job "${displayName}" was aborted`));
                });
            }
        }).finally(() => {
            if (!this.abortedByUser) {
                this.log.info(dictionary("app.domain.entities.job.sendUdp.finished", displayName));
                ctx.log.info(dictionary("app.domain.entities.job.sendUdp.finished", displayName));
                this.dispatchEvent(jobEvents.jobFinished, { jobId: this.id, failed: this.failed });
            }
        });
    }


}

export default SendUDPJob;