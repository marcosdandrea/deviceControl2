import { JobType } from "@common/types/job.type";
import { Job } from "../..";
import { jobTypes } from "..";

interface SendTCPJobParams extends JobType {
    answer?: string | null; // Optional answer to check against the response
}

export class SendTCPJob extends Job {

    static type = "sendTCP";
    answer: string | null = null;

    constructor(options: SendTCPJobParams) {
        super({
            ...options,
            type: jobTypes.sendTCPJob,
            timeout: 5000,
            enableTimoutWatcher: true
        });

        if (options.params?.answer && typeof options.params.answer !== 'string')
            throw new Error("Answer must be a string or null");
        
        this.answer = options.params?.answer || null;
    }

    #getParameters(): Record<string, any> {
        const params = this.params || {};

        const expectedParams = ["ipAddress", "portNumber", "message"];
        const missingParams = expectedParams.filter(param => !(param in params));

        if (missingParams.length > 0)
            throw new Error(`Missing required parameters: ${missingParams.join(", ")}`);

        if (Number(params.portNumber) < 0 || Number(params.portNumber) > 65535)
            throw new Error("Port Number must be a number between 0 and 65535");

        if (params.message && typeof params.message !== 'string')
            throw new Error("Message must be a string");

        const ipMask = /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
        if (!ipMask.test(params.ipAddress))
            throw new Error("Ip Address must be a valid IPv4 address");

        return params as Record<string, any>;
    }

    protected async job(): Promise<void> {
        this.failed = false;
        const { signal: abortSignal } = this.abortController || {};
        this.log.info(`Starting job "${this.name}" with ID ${this.id}`);

        try {
            let { ipAddress, portNumber, message } = this.#getParameters();

            const net = require('net');
            const client = new net.Socket();

            await new Promise<void>((resolve, reject) => {

                client.connect(portNumber, ipAddress, () => {
                    client.write(message);
                    this.log.info(`TCP packet sent successfully to ${ipAddress}:${portNumber}`);

                    console.log (this.answer)
                    
                    if (this.answer !== null) {
                        this.log.info(`Waiting for response matching: ${this.answer}`);
                        return
                    } else {
                        client.end();
                        resolve()
                    }
                })

                client.on('error', (err) => {
                    this.log.error(`Failed to send TCP packet: ${err.message}`);
                    reject(err);
                });

                if (this.answer !== null) {
                    client.on("data", (data: Buffer) => {
                        const response = data.toString();
                        this.log.info(`Received response: ${this.answer}`);
                        if (response !== this.answer)
                            return

                        client.end();
                        resolve();
                    });
                }


            });


            return Promise.resolve();

        } catch (error) {
            this.log.error(`Error in job "${this.name}": ${error.message}`);
            return Promise.reject(`Failed to send TCP packet: ${error.message}`);
        }
    }

}