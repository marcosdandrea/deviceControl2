import { Condition } from "../..";
import { ConditionType } from "@common/types/condition.type";
import net from 'net';

interface ConditionTCPAnswerParams extends Partial<ConditionType> {
    ip: string;
    port: number;
    message: string;
    answer: string;
    timeoutValue?: number;
}

export class ConditionTCPAnswer extends Condition {
    static type = "tcpAnswer";
    ip: string;
    port: number;
    message: string;
    answer: string;

    constructor(options: ConditionTCPAnswerParams) {
        super({
            ...options,
            type: ConditionTCPAnswer.type,
            name: options.name || "TCP Answer Condition",
            description: options.description || "Condition that waits for a TCP answer",
            timeoutValue: options.timeoutValue
        } as ConditionType);

        const ipMask = /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
        if (!options.ip || !ipMask.test(options.ip))
            throw new Error("Ip address must be a valid IPv4 address");
        if (typeof options.port !== 'number' || options.port < 0 || options.port > 65535)
            throw new Error("Port must be a number between 0 and 65535");
        if (!options.message || typeof options.message !== 'string')
            throw new Error("Message must be a string");
        if (!options.answer || typeof options.answer !== 'string')
            throw new Error("Answer must be a string");

        this.ip = options.ip;
        this.port = options.port;
        this.message = options.message;
        this.answer = options.answer;
    }

    protected async doEvaluation({ abortSignal }: { abortSignal: AbortSignal }): Promise<boolean> {
        return new Promise((resolve, reject) => {
            const client = new net.Socket();
            const onAbort = () => {
                client.destroy();
                reject(new Error("Condition evaluation aborted"));
            };

            if (abortSignal.aborted) return onAbort();

            abortSignal.addEventListener("abort", onAbort, { once: true });

            client.connect(this.port, this.ip, () => {
                client.write(this.message);
            });

            client.on('data', (data: Buffer) => {
                const response = data.toString();
                this.logger.info('Received:', response);
                if (response === this.answer) {
                    abortSignal.removeEventListener("abort", onAbort);
                    client.destroy();
                    resolve(true);
                }
            });

            client.on('error', (err) => {
                abortSignal.removeEventListener("abort", onAbort);
                client.destroy();
                reject(err);
            });
        });
    }
}

export default ConditionTCPAnswer;
