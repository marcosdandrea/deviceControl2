import { Condition } from "../..";
import { ConditionType } from "@common/types/condition.type";
import dgram from 'dgram';

interface ConditionUDPAnswerParams extends Partial<ConditionType> {
    ip: string;
    port: number;
    message: string;
    answer: string;
    timeoutValue?: number;
}

export class ConditionUDPAnswer extends Condition {
    static type = "udpAnswer";
    ip: string;
    port: number;
    message: string;
    answer: string;

    constructor(options: ConditionUDPAnswerParams) {
        super({
            ...options,
            type: ConditionUDPAnswer.type,
            name: options.name || "UDP Answer Condition",
            description: options.description || "Condition that waits for a UDP answer",
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
            const socket = dgram.createSocket('udp4');
            let finished = false;
            const onAbort = () => {
                if (!finished) {
                    finished = true;
                    socket.close();
                    reject(new Error("Condition evaluation aborted"));
                }
            };

            if (abortSignal.aborted) return onAbort();

            abortSignal.addEventListener("abort", onAbort, { once: true });

            socket.on('message', (msg) => {
                const resp = msg.toString();
                if (resp === this.answer) {
                    finished = true;
                    abortSignal.removeEventListener("abort", onAbort);
                    socket.close();
                    resolve(true);
                }
            });

            socket.on('error', (err) => {
                if (!finished) {
                    finished = true;
                    abortSignal.removeEventListener("abort", onAbort);
                    socket.close();
                    reject(err);
                }
            });

            const buffer = Buffer.from(this.message);
            socket.send(buffer, this.port, this.ip, (err) => {
                if (err) {
                    onAbort();
                    reject(err);
                }
            });
        });
    }
}

export default ConditionUDPAnswer;
