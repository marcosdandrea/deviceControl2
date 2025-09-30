import { JobType, requiredJobParamType } from "@common/types/job.type";
import { Job } from "../..";
import Artnet from "@src/services/artnet";
import jobEvents from "@common/events/job.events";
import { jobTypes } from "..";

interface SendArtnetJobParams extends JobType {
    // Optional host and port can be provided
    params: {
        channels: string;
        universe: number;
        value: number;
        host?: string;
        port?: number;
        interpolate?: boolean;
        interpolationTime?: number;
    } & Record<string, any>;
}

export class SendArtnetJob extends Job {
    static get name(): string {
        return "Controlar Art-Net";
    }
    static description = "Sends an Art-Net DMX value to the selected channels within a universe.";
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
            name: "channels",
            type: "string",
            validationMask: "^[0-9,\\-\\s]+$",
            description: "ej: 1,3,55-120,140-240",
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

        let channels: number[], universe: number, value: number, host: string | undefined, port: number | undefined;

        try {
            const { channels: rawChannels, universe: parsedUniverse, value: parsedValue, host: parsedHost, port: parsedPort } = this.params;
            channels = this.parseChannels(rawChannels);
            universe = parsedUniverse;
            value = parsedValue;
            host = parsedHost;
            port = parsedPort;
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
                        channels.forEach((channelIndex) => {
                            sender.setChannel(channelIndex, value);
                        });
                        handleOnFinish();
                    } else {
                        const startValues = channels.map((channelIndex) => sender.values[channelIndex] ?? 0);
                        const steps = Math.max(1, Math.floor(interpolationTime / 50));
                        const stepTime = interpolationTime / steps;
                        let currentStep = 0;
                        interval = setInterval(() => {
                            currentStep++;
                            channels.forEach((channelIndex, index) => {
                                const startValue = startValues[index];
                                const newVal = Math.round(startValue + (value - startValue) * (currentStep / steps));
                                sender.setChannel(channelIndex, newVal);
                            });
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

    private parseChannels(input: unknown): number[] {
        if (typeof input !== "string" || input.trim() === "") {
            throw new Error("The channels parameter must be a non-empty string");
        }

        const parts = input.split(",");
        const rawChannels: number[] = [];

        const addChannel = (channel: number) => {
            if (!Number.isInteger(channel)) {
                throw new Error(`Channel index "${channel}" is not an integer value`);
            }

            if (channel < 0 || channel > 512) {
                throw new Error(`Channel index "${channel}" is out of range (0-512)`);
            }

            rawChannels.push(channel);
        };

        for (const rawPart of parts) {
            const part = rawPart.trim();
            if (!part) {
                throw new Error("Empty channel entry detected in channels parameter");
            }

            const rangeMatch = part.match(/^(-?\d+)\s*-\s*(-?\d+)$/);
            if (rangeMatch) {
                const start = Number(rangeMatch[1]);
                const end = Number(rangeMatch[2]);

                if (start > end) {
                    throw new Error(`Invalid channel range "${part}". Start must be less than or equal to end.`);
                }

                for (let channel = start; channel <= end; channel++) {
                    addChannel(channel);
                }
                continue;
            }

            const singleChannel = Number(part);
            if (Number.isNaN(singleChannel)) {
                throw new Error(`Channel entry "${part}" is not a valid number`);
            }

            addChannel(singleChannel);
        }

        if (rawChannels.length === 0) {
            throw new Error("No valid channels were provided");
        }

        const zeroBased = rawChannels.some((channel) => channel === 0);
        const resolvedChannels = new Set<number>();

        rawChannels.forEach((channel) => {
            const normalizedChannel = zeroBased
                ? Math.min(channel, 511)
                : Math.min(channel - 1, 511);

            if (normalizedChannel < 0) {
                throw new Error(`Channel index "${channel}" is invalid for DMX addressing`);
            }

            resolvedChannels.add(normalizedChannel);
        });

        return Array.from(resolvedChannels.values()).sort((a, b) => a - b);
    }
}

export default SendArtnetJob;