import { JobType, requiredJobParamType } from "@common/types/job.type";
import { Job } from "../..";
import jobEvents from "@common/events/job.events";
import dgram from 'dgram';
import { jobTypes } from "..";
import ip from "ip";
import { Context } from "@src/domain/entities/context";

export interface WakeOnLanJobType extends JobType {
    params: {
        macAddress: string;
        portNumber: number;
    }
}


export class WakeOnLanJob extends Job {
    static type = jobTypes.wakeOnLanJob;
    static name = "Wake-on-LAN Job";
    static description = "Sends a Wake-on-LAN (WoL) magic packet to a specified MAC address to wake up a device.";

    constructor(options: WakeOnLanJobType) {
        super({
            ...options,
            timeout: 5000, // Default timeout of 5 seconds
            enableTimoutWatcher: false,
            type: jobTypes.sendUDPJob
        });

        this.validateParams()

    }

    requiredParams(): requiredJobParamType[] {
        return [
            {
                name: "macAddress",
                type: "string",
                description: "The MAC address of the device to wake up (format: XX:XX:XX:XX:XX:XX)",
                required: true
            },
            {
                name: "portNumber",
                type: "number",
                description: "The port number to send the magic packet to (default: 9)",
                required: false,

            }
        ];
    }



    async job(ctx: Context): Promise<void> {
        this.failed = false;
        const { signal: abortSignal } = this.abortController || {};
        ctx.log.info(`Starting job "${this.name}" with ID ${this.id}`);
        this.log.info(`Starting job "${this.name}" with ID ${this.id}`);

        let macAddress, portNumber

        try {
            ({ macAddress, portNumber } = this.params)
        } catch (error) {
            this.failed = true;
            this.dispatchEvent(jobEvents.jobError, { jobId: this.id, error });
            throw error;
        }

        const client = dgram.createSocket('udp4');

        client.bind(() => {
            client.setBroadcast(true);
        });

        const buildMagicPacket = (mac: string): Buffer => {
            const macBytes = mac.split(/[:-]/).map(b => parseInt(b, 16));
            const buffer = Buffer.alloc(6 + 16 * 6, 0xff);
            for (let i = 0; i < 16; i++) {
                for (let j = 0; j < 6; j++) {
                    buffer[6 + i * 6 + j] = macBytes[j];
                }
            }
            return buffer;
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
                    this.failed = true;
                    this.dispatchEvent(jobEvents.jobError, { jobId: this.id, error: err });
                    reject(err);
                }
            };

            const messageBuffer = buildMagicPacket(macAddress);
            client.send(messageBuffer, 0, messageBuffer.length, portNumber, "255.255.255.255", (err) => {
                if (err) {
                    this.log.error(`Failed to send UDP packet: ${err.message}`);
                    ctx.log.error(`Failed to send UDP packet: ${err.message}`);
                    return safeReject(err);
                }
                ctx.log.info(`UDP packet to wake device with MAC "${macAddress}" sent to port ${portNumber}`);
                safeResolve();
            });

            if (abortSignal) {
                abortSignal.addEventListener("abort", () => {
                    safeReject(new Error(`Job "${this.name}" was aborted`));
                });
            }
        }).finally(() => {
            this.log.info(`Job "${this.name}" with ID ${this.id} has finished`);
            ctx.log.info(`Job "${this.name}" with ID ${this.id} has finished`);
            this.dispatchEvent(jobEvents.jobFinished, { jobId: this.id, failed: this.failed });
        });
    }


}

export default WakeOnLanJob;