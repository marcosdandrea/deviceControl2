import { JobType } from "@common/types/job.type";
import { Job } from "../..";
import jobEvents from "@common/events/job.events";
import dgram from 'dgram';
import { jobTypes } from "..";
import ip from "ip";
import { Context } from "@src/domain/entities/context";

export interface SendUDPJobType extends JobType {
    params: {
        ipAddress: string;
        portNumber: number;
        message: string | Buffer; 
        subnetMask?: string; // Optional, used for broadcast detection
    }
}


export class SendUDPJob extends Job {

    constructor(options: SendUDPJobType) {
        super({
            ...options,
            timeout: 5000, // Default timeout of 5 seconds
            enableTimoutWatcher: false,
            type: jobTypes.sendUDPJob
        });

    }

    #getParameters(): Record<string, any> {
        const params = this.params || {};

        const expectedParams = ["ipAddress", "portNumber", "message", "subnetMask"];
        const missingParams = expectedParams.filter(param => !(param in params));

        if (missingParams.length > 0)
            throw new Error(`Missing required parameters: ${missingParams.join(", ")}`);

        if (Number(params.portNumber) < 0 || Number(params.portNumber) > 65535)
            throw new Error("Port number must be a number between 0 and 65535");

        if (params.message && (typeof params.message !== 'string' && !Buffer.isBuffer(params.message)))
            throw new Error("Message must be a string or a buffer");

        const ipMask = /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
        if (!ipMask.test(params.ipAddress))
            throw new Error("Ip address must be a valid IPv4 address");

        if (params.subnetMask && !ipMask.test(params.subnetMask))
            throw new Error("Subnet mask must be a valid IPv4 address");

        return params as Record<string, any>;
    }

    async job(ctx: Context): Promise<void> {
        this.failed = false;
        const { signal: abortSignal } = this.abortController || {};
        ctx.log.info(`Starting job "${this.name}" with ID ${this.id}`);

        let ipAddress, portNumber, message, subnetMask;

        try {
            ({ ipAddress, portNumber, message, subnetMask } = this.#getParameters());
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
            ctx.log.info(`Sending UDP packet to broadcast address ${ipAddress}:${portNumber}`);
            client.bind(() => {
                client.setBroadcast(true);
            });
        }

        const messageBuffer = Buffer.isBuffer(this.params.message) ? this.params.message : Buffer.from(message, 'utf-8');

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
                    this.failed = true;
                    this.dispatchEvent(jobEvents.jobError, { jobId: this.id, error: err });
                    reject(err);
                }
            };

            client.send(messageBuffer, 0, messageBuffer.length, portNumber, ipAddress, (err) => {
                if (err) {
                    ctx.log.error(`Failed to send UDP packet: ${err.message}`);
                    return safeReject(err);
                }
                safeResolve();
            });

            if (abortSignal) {
                abortSignal.addEventListener("abort", () => {
                    safeReject(new Error(`Job "${this.name}" was aborted`));
                });
            }
        }).finally(() => {
            ctx.log.info(`Job "${this.name}" with ID ${this.id} has finished`);
            this.dispatchEvent(jobEvents.jobFinished, { jobId: this.id, failed: this.failed });
        });
    }


}