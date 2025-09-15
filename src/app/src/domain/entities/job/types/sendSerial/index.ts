import { JobType, requiredJobParamType } from "@common/types/job.type";
import { Job } from "../..";
import jobEvents from "@common/events/job.events";
import { jobTypes } from "..";
import e from "cors";

interface SendSerialJobParams extends JobType {
    params: {
        port: string;
        baudRate?: number;
        message: string | Buffer;
        encoding?: BufferEncoding;
    } & Record<string, any>;
}

export class SendSerialJob extends Job {
    static name = "Send Serial Job"
    static description = "Sends a message over a specified serial port.";
    static type = jobTypes.sendSerialJob;

    constructor(options: SendSerialJobParams) {
        super({
            ...options,
            timeout: 5000,
            enableTimoutWatcher: true,
            type: jobTypes.sendSerialJob,
        });

        this.validateParams();
    }

    requiredParams(): requiredJobParamType[] {
        return [{
            name: "port",
            type: "string",
            validationMask: "^.+$",
            description: "Serial port to use",
            required: true
        },
        {
            name: "baudRate",
            type: "number",
            validationMask: "^(\\d+)$",
            description: "Baud rate for the serial connection. Defaults to 9600.",
            required: false
        },
        {
            name: "message",
            type: "string",
            validationMask: "^.+$",
            description: "Message to send",
            required: true
        },
        {
            name: "encoding",
            type: "string",
            validationMask: "^(utf-8|ascii|base64)$",
            description: "Encoding of the message. Defaults to 'utf-8'.",
            required: false
        }
        ];
    }


    async job(): Promise<void> {
        this.failed = false;
        const { signal: abortSignal } = this.abortController || {};
        this.log.info(`Starting job \"${this.name}\" with ID ${this.id}`);

        let { SerialPort } = await import('serialport')

        let port: string, baudRate: number, message: string | Buffer, encoding: BufferEncoding;
        try {
            ({ port, baudRate, message, encoding } = this.params);
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
                if (err.message.includes('was aborted')) {
                    this.log.warn(err.message);
                } else {
                    this.failed = true;
                    this.dispatchEvent(jobEvents.jobError, { jobId: this.id, error: err });
                }
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
            if (!this.abortedByUser) {
                this.log.info(`Job \"${this.name}\" with ID ${this.id} has finished`);
                this.dispatchEvent(jobEvents.jobFinished, { jobId: this.id, failed: this.failed });
            }
        });
    }
}


export default SendSerialJob;