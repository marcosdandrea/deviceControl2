import { JobType } from "@common/types/job.type";
import { Job } from "../..";
import jobEvents from "@common/events/job.events";
import { jobTypes } from "..";

interface SendSerialJobParams extends JobType {
    params: {
        port: string;
        baudRate?: number;
        message: string | Buffer;
        encoding?: BufferEncoding;
    } & Record<string, any>;
}

export class SendSerialJob extends Job {
    constructor(options: SendSerialJobParams) {
        super({
            ...options,
            timeout: 5000,
            enableTimoutWatcher: true,
            type: jobTypes.sendSerialJob,
        });
    }

    #getParameters(): Required<SendSerialJobParams>["params"] {
        const params = this.params || {};
        const expectedParams = ["port", "message"];
        const missing = expectedParams.filter(p => !(p in params));
        if (missing.length > 0) {
            throw new Error(`Missing required parameters: ${missing.join(", ")}`);
        }
        if (typeof params.port !== "string")
            throw new Error("port must be a string");
        if (params.baudRate !== undefined && (typeof params.baudRate !== "number" || params.baudRate <= 0))
            throw new Error("baudRate must be a positive number");
        if (!(typeof params.message === "string" || Buffer.isBuffer(params.message)))
            throw new Error("message must be a string or Buffer");
        if (params.encoding && typeof params.encoding !== "string")
            throw new Error("encoding must be a string");
        return params as Required<SendSerialJobParams>["params"];
    }

    async job(): Promise<void> {
        this.failed = false;
        const { signal: abortSignal } = this.abortController || {};
        this.log.info(`Starting job \"${this.name}\" with ID ${this.id}`);

        let SerialPort;
        try {
            ({ SerialPort } = await import('serialport'));
        } catch (err) {
            this.log.error('serialport module is not installed');
            throw new Error('serialport module not available');
        }

        let { port, baudRate, message, encoding };
        try {
            ({ port, baudRate, message, encoding } = this.#getParameters());
        } catch (error) {
            this.failed = true;
            this.dispatchEvent(jobEvents.jobError, { jobId: this.id, error });
            throw error;
        }

        return new Promise<void>((resolve, reject) => {
            const sp = new SerialPort({ path: port, baudRate: baudRate || 9600 });
            const cleanUp = () => {
                sp.removeAllListeners();
                sp.close();
            };

            const onError = (err: Error) => {
                cleanUp();
                this.failed = true;
                this.dispatchEvent(jobEvents.jobError, { jobId: this.id, error: err });
                reject(err);
            };

            sp.on('error', onError);

            if (abortSignal) {
                abortSignal.addEventListener('abort', () => {
                    onError(new Error(`Job \"${this.name}\" was aborted`));
                });
            }

            sp.write(message, encoding, (err) => {
                if (err) return onError(err);
                this.log.info(`Serial message sent to ${port}`);
                cleanUp();
                resolve();
            });
        }).finally(() => {
            this.log.info(`Job \"${this.name}\" with ID ${this.id} has finished`);
            this.dispatchEvent(jobEvents.jobFinished, { jobId: this.id, failed: this.failed });
        });
    }
}
