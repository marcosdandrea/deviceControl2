import { JobType, requiredJobParamType } from "@common/types/job.type";
import { Job } from "../..";
import { jobTypes } from "..";

interface SendTCPJobParams extends JobType {
    answer?: string | null; // Optional answer to check against the response
}

export class SendTCPJob extends Job {
    static description = "Sends a TCP packet to a specified IP address and port.";
    static name = "Send TCP Packet Job";
    static type = jobTypes.sendTCPJob;
    
    answer: string | null = null;

    constructor(options: SendTCPJobParams) {
        super({
            ...options,
            type: jobTypes.sendTCPJob,
            timeout: 5000,
            enableTimoutWatcher: true
        });

        this.validateParams();

    }

    requiredParams(): requiredJobParamType[] {
        return [{
            name: "ipAddress",
            type: "string",
            validationMask: "^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$",
            description: "Target IPv4 address",
            required: true
        },
        {
            name: "portNumber",
            type: "number",
            validationMask: "^(\\d{1,5})$",
            description: "Target port number (0-65535)",
            required: true
        },
        {
            name: "message",
            type: "string",
            validationMask: "^[\\s\\S]+$",
            description: "Message to send",
            required: true
        }
        ];
    }


    protected async job(): Promise<void> {
        this.failed = false;
        const { signal: abortSignal } = this.abortController || {};
        this.log.info(`Starting job "${this.name}" with ID ${this.id}`);

        try {
            let { ipAddress, portNumber, message } = this.params;

            const net = require('net');
            const client = new net.Socket();

            await new Promise<void>((resolve, reject) => {

                client.connect(portNumber, ipAddress, () => {
                    client.write(message);
                    this.log.info(`TCP packet sent successfully to ${ipAddress}:${portNumber}`);

                    console.log(this.answer)

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

export default SendTCPJob;