import { JobType, requiredJobParamType } from "@common/types/job.type";
import { Job } from "../..";
import { jobTypes } from "..";
import dictionary from "@common/i18n";
import { Context } from "@src/domain/entities/context";
import { a } from "vitest/dist/chunks/suite.B2jumIFP.js";

interface SendTCPJobParams extends JobType {
    answer?: string | null; // Optional answer to check against the response
}

export class SendTCPJob extends Job {
    static description = "Sends a TCP packet to a specified IP address and port.";
    static name = "Enviar paquete TCP";
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


    protected async job({ctx, abortSignal}: {ctx: Context, abortSignal: AbortSignal}): Promise<void> {
        this.failed = false;
        const displayName = this.getDisplayName();
        this.log.info(dictionary("app.domain.entities.job.sendUdp.starting", displayName));

        try {
            let { ipAddress, portNumber, message } = this.params;

            const net = require('net');
            const client = new net.Socket();

            await new Promise<void>((resolve, reject) => {

                client.connect(portNumber, ipAddress, () => {
                    client.write(message);
                    this.log.info(dictionary("app.domain.entities.job.sendTcp.sent", ipAddress, portNumber));

                    if (this.answer !== null) {
                        this.log.info(`Waiting for response matching: ${this.answer}`);
                        return
                    } else {
                        client.end();
                        resolve()
                    }
                })

                client.on('error', (err) => {
                    const errorMessage = dictionary("app.domain.entities.job.sendTcp.failed", err.message);
                    this.log.error(errorMessage);
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

                abortSignal.addEventListener('abort', () => {
                    client.end();
                    this.log.warn(ctx.log.warn(dictionary("app.domain.entities.job.aborted", displayName)));
                    reject(dictionary("app.domain.entities.job.aborted", displayName));
                }, { once: true })


            });


            return Promise.resolve();

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            const localizedError = dictionary("app.domain.entities.job.sendTcp.failed", errorMessage);
            this.log.error(localizedError);
            return Promise.reject(new Error(localizedError));
        }
    }

}

export default SendTCPJob;