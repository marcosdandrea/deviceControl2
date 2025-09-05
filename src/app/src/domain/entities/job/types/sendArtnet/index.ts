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
    static name = "Send Art-Net Job";
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
            validationMask: "^(\\d{1,3})$",
            description: "DMX channel to set (1-512)",
            required: true
        },
        {
            name: "universe",
            type: "number",
            validationMask: "^(\\d{1,5})$",
            description: "DMX universe (0-65535)",
            required: true
        },
        {
            name: "value",
            type: "number",
            validationMask: "^(\\d{1,3})$",
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
                    this.failed = true;
                    this.dispatchEvent(jobEvents.jobError, { jobId: this.id, error: err });
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
            this.log.info(`Job \"${this.name}\" with ID ${this.id} has finished`);
            this.dispatchEvent(jobEvents.jobFinished, { jobId: this.id, failed: this.failed });
        });
    }
}

export default SendArtnetJob;