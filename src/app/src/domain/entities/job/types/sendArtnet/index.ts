import { JobType } from "@common/types/job.type";
import { Job } from "../..";
import { dmxnet } from "dmxnet";
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
    constructor(options: SendArtnetJobParams) {
        super({
            ...options,
            timeout: 5000,
            enableTimoutWatcher: true,
            type: jobTypes.sendArtnetJob,
        });
    }

    #getParameters(): Record<string, any> {
        const params = this.params || {};
        const expectedParams = ["channel", "universe", "value"];
        const missingParams = expectedParams.filter(p => !(p in params));
        if (missingParams.length > 0)
            throw new Error(`Missing required parameters: ${missingParams.join(", ")}`);

        if (typeof params.channel !== "number" || params.channel < 1 || params.channel > 512)
            throw new Error("channel must be a number between 1 and 512");

        if (typeof params.universe !== "number" || params.universe < 0 || params.universe > 65535)
            throw new Error("universe must be a number between 0 and 65535");

        if (typeof params.value !== "number" || params.value < 0 || params.value > 255)
            throw new Error("value must be a number between 0 and 255");

        if (params.host && typeof params.host !== "string")
            throw new Error("host must be a string");

        if (params.port && (typeof params.port !== "number" || params.port < 0 || params.port > 65535))
            throw new Error("port must be a number between 0 and 65535");

        if (params.interpolate !== undefined && typeof params.interpolate !== "boolean")
            throw new Error("interpolate must be a boolean");

        if (params.interpolationTime !== undefined && (typeof params.interpolationTime !== "number" || params.interpolationTime <= 0))
            throw new Error("interpolationTime must be a number greater than 0");
      
        return params as Record<string, any>;
    }

    async job(): Promise<void> {
        this.failed = false;
        const { signal: abortSignal } = this.abortController || {};
        this.log.info(`Starting job "${this.name}" with ID ${this.id}`);

        let channel: number, universe: number, value: number, host: string | undefined, port: number | undefined;

        try {
            ({ channel, universe, value, host, port } = this.#getParameters());
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

        const dmx = new dmxnet();
        const sender = dmx.newSender({ ip: host || "255.255.255.255", port, net, subnet, universe: uni });

        return new Promise<void>((resolve, reject) => {
            let interval: NodeJS.Timeout | null = null;
            const finish = (err?: Error) => {
                if (interval) clearInterval(interval);
                setTimeout(() => {
                    sender.stop();
                    dmx.listener4.close();
                    dmx.socket.close();
                    if (err) {
                        this.failed = true;
                        this.dispatchEvent(jobEvents.jobError, { jobId: this.id, error: err });
                        reject(err);
                    } else {
                        resolve();
                    }
                }, 10);
            };

            const executeSend = () => {
                try {
                    if (!interpolate) {
                        sender.setChannel(channel - 1, value);
                        finish();
                    } else {
                        const startValue = sender.values[channel - 1] ?? 0;
                        const steps = Math.max(1, Math.floor(interpolationTime / 50));
                        const stepTime = interpolationTime / steps;
                        let currentStep = 0;
                        interval = setInterval(() => {
                            currentStep++;
                            const newVal = Math.round(startValue + (value - startValue) * (currentStep / steps));
                            sender.setChannel(channel - 1, newVal);
                            if (currentStep >= steps) finish();
                        }, stepTime);
                    }
                } catch (err) {
                    finish(err as Error);
                }
            };


            if (abortSignal) {
                abortSignal.addEventListener("abort", () => {
                    finish(new Error(`Job \"${this.name}\" was aborted`));
                });
            }

            executeSend();

        }).finally(() => {
            this.log.info(`Job \"${this.name}\" with ID ${this.id} has finished`);
            this.dispatchEvent(jobEvents.jobFinished, { jobId: this.id, failed: this.failed });
        });
    }
}

