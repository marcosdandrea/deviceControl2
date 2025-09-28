import { JobType, requiredJobParamType } from "@common/types/job.type";
import { Job } from "../..";
import jobEvents from "@common/events/job.events";
import dgram from 'dgram';
import { jobTypes } from "..";
import { Context } from "@src/domain/entities/context";
import dictionary from "@common/i18n";

export interface WakeOnLanJobType extends JobType {
    params: {
        macAddress: string;
        portNumber: number;
    }
}


export class WakeOnLanJob extends Job {
    static type = jobTypes.wakeOnLanJob;
    static name = "Wake-on-LAN";
    static description = "Sends a Wake-on-LAN (WoL) magic packet to a specified MAC address to wake up a device.";

    constructor(options: WakeOnLanJobType) {
        super({
            ...options,
            timeout: 5000, // Default timeout of 5 seconds
            enableTimoutWatcher: false,
            type: jobTypes.wakeOnLanJob
        });

        this.validateParams()

    }

    requiredParams(): requiredJobParamType[] {
        return [
            {
            name: "macAddress",
            type: "string",
            description: "The MAC address of the device to wake up (format: XX:XX:XX:XX:XX:XX)",
            validationMask: "^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$",
            required: true
            },
            {
            name: "portNumber",
            type: "number",
            description: "The port number to send the magic packet to (default: 9)",
            validationMask: "^(6553[0-5]|655[0-2]\\d|65[0-4]\\d{2}|6[0-4]\\d{3}|[1-5]\\d{4}|[1-9]\\d{0,3}|0)$",
            required: false,
            }
        ];
    }



    async job(ctx: Context): Promise<void> {
        this.failed = false;
        const { signal: abortSignal } = this.abortController || {};
        const displayName = this.getDisplayName();
        ctx.log.info(dictionary("app.domain.entities.job.wakeOnLan.starting", displayName));
        this.log.info(dictionary("app.domain.entities.job.wakeOnLan.starting", displayName));

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

            const messageBuffer = buildMagicPacket(macAddress);
            client.send(messageBuffer, 0, messageBuffer.length, portNumber, "255.255.255.255", (err) => {
                if (err) {
                    this.log.error(dictionary("app.domain.entities.job.wakeOnLan.failed", err.message));
                    ctx.log.error(dictionary("app.domain.entities.job.wakeOnLan.failed", err.message));
                    return safeReject(err);
                }
                ctx.log.info(dictionary("app.domain.entities.job.wakeOnLan.sent", macAddress, portNumber));
                safeResolve();
            });

            if (abortSignal) {
                abortSignal.addEventListener("abort", () => {
                    safeReject(new Error(dictionary("app.domain.entities.job.aborted", displayName)));
                });
            }
        }).finally(() => {
            if (!this.abortedByUser) {
                this.log.info(dictionary("app.domain.entities.job.wakeOnLan.finished", displayName));
                ctx.log.info(dictionary("app.domain.entities.job.wakeOnLan.finished", displayName));
                this.dispatchEvent(jobEvents.jobFinished, { jobId: this.id, failed: this.failed });
            }
        });
    }


}

export default WakeOnLanJob;