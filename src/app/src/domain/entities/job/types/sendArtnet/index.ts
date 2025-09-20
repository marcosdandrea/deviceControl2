import { JobType, requiredJobParamType } from "@common/types/job.type";
import { Job } from "../..";
import Artnet from "@src/services/artnet";
import jobEvents from "@common/events/job.events";
import { jobTypes } from "..";

interface SendArtnetJobParams extends JobType {
    // Optional host and port can be provided
    params: {
        channel: number;
        universe: number;
        value: number;
        host?: string;
        port?: number;
        interpolate?: boolean;
        interpolationTime?: number;
    } & Record<string, any>;
}

export class SendArtnetJob extends Job {
    static name = "Controlar Art-Net";
    static description = "Sends an Art-Net DMX value to a specified channel and universe.";
    static type = jobTypes.sendArtnetJob;

    constructor(options: SendArtnetJobParams) {
        super({
            ...options,
            timeout: 5000,
            enableTimoutWatcher: true,
            type: jobTypes.sendArtnetJob,
        });

        this.validateParams();
    }

    requiredParams(): requiredJobParamType[] {
        return [{
            name: "channel",
            type: "number",
            validationMask: "^(?:[1-9]|[1-9]\\d|[1-4]\\d\\d|50[0-9]|51[0-2])$",
            description: "DMX channel to set (1-512)",
            required: true
        },
        {
            name: "universe",
            type: "number",
            validationMask: "^(?:6553[0-5]|655[0-2]\\d|65[0-4]\\d{2}|6[0-4]\\d{3}|[1-9]?\\d{1,4})$",
            description: "DMX universe (0-65535)",
            required: true
        },
        {
            name: "value",
            type: "number",
            validationMask: "^(25[0-5]|2[0-4]\\d|[0-1]?\\d?\\d)$",
            description: "DMX value to set (0-255)",
            required: true
        }
        ];
    }

    async job(): Promise<void> {
        this.failed = false;
        const { signal: abortSignal } = this.abortController || {};
        this.log.info(`Starting job "${this.name}" with ID ${this.id}`);

        let channel: number, universe: number, value: number, host: string | undefined, port: number | undefined;

        try {
            ({ channel, universe, value, host, port } = this.params);
        } catch (error) {
            this.failed = true;
            this.dispatchEvent(jobEvents.jobError, { jobId: this.id, error });
            throw error;
        }

        const interpolate = this.params.interpolate === true;
        const interpolationTime = this.params.interpolationTime ?? 1000;

        // convert universe number into net/subnet/universe values
        const net = (universe >> 8) & 0x7f;
        const subnet = (universe >> 4) & 0xf;
        const uni = universe & 0xf;

        const artnet = Artnet.getInstance();
        const sender = artnet.getSender({ ip: host || "255.255.255.255", port, net, subnet, universe: uni });

        return new Promise<void>((resolve, reject) => {
            let interval: NodeJS.Timeout | null = null;

            const handleOnFinish = (err?: Error) => {
                if (interval) clearInterval(interval);
                if (err) {
                    if (err.message.includes('was aborted')) {
                        this.log.warn(err.message);
                    } else {
                        this.failed = true;
                        this.dispatchEvent(jobEvents.jobError, { jobId: this.id, error: err });
                    }
                    reject(err);
                } else {
                    resolve();
                }
            };

            const executeSend = () => {
                try {
                    if (!interpolate) {
                        sender.setChannel(channel - 1, value);
                        handleOnFinish();
                    } else {
                        const startValue = sender.values[channel - 1] ?? 0;
                        const steps = Math.max(1, Math.floor(interpolationTime / 50));
                        const stepTime = interpolationTime / steps;
                        let currentStep = 0;
                        interval = setInterval(() => {
                            currentStep++;
                            const newVal = Math.round(startValue + (value - startValue) * (currentStep / steps));
                            sender.setChannel(channel - 1, newVal);
                            if (currentStep >= steps) handleOnFinish();
                        }, stepTime);
                    }
                } catch (err) {
                    handleOnFinish(err as Error);
                }
            };

            if (abortSignal) {
                abortSignal.addEventListener("abort", () => {
                    handleOnFinish(new Error(`Job \"${this.name}\" was aborted`));
                });
            }

            executeSend();

        }).finally(() => {
            if (!this.abortedByUser) {
                this.log.info(`Job \"${this.name}\" with ID ${this.id} has finished`);
                this.dispatchEvent(jobEvents.jobFinished, { jobId: this.id, failed: this.failed });
            }
        });
    }
}

export default SendArtnetJob;