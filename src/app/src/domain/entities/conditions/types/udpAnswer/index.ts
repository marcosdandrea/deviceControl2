import { Condition } from "../..";
import { ConditionType, requiredConditionParamType } from "@common/types/condition.type";
import dgram from 'dgram';
import { conditionTypes } from "..";

interface ConditionUDPAnswerParams extends Partial<ConditionType> {
    ip: string;
    port: number;
    message: string;
    answer: string;
    timeoutValue?: number;
}

export class ConditionUDPAnswer extends Condition {
    static description = "Condition that waits for a UDP answer";
    static name = "UDP Answer Condition";
    static type = conditionTypes.udpAnswer;
    ip: string;
    port: number;
    message: string;
    answer: string;

    constructor(options: ConditionUDPAnswerParams) {
        super({
            ...options,
            type: conditionTypes.udpAnswer,
            name: options.name || "UDP Answer Condition",
            description: options.description || "Condition that waits for a UDP answer",
            timeoutValue: options.timeoutValue
        } as ConditionType);

        const ipMask = /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
        if (!options.params.ip || !ipMask.test(options.params.ip))
            throw new Error("Ip address must be a valid IPv4 address");
        if (typeof options.params.port !== 'number' || options.params.port < 0 || options.params.port > 65535)
            throw new Error("Port must be a number between 0 and 65535");
        if (!options.params.message || typeof options.params.message !== 'string')
            throw new Error("Message must be a string");
        if (!options.params.answer || typeof options.params.answer !== 'string')
            throw new Error("Answer must be a string");

        this.validateParams();

        this.ip = options.params.ip;
        this.port = options.params.port;
        this.message = options.params.message;
        this.answer = options.params.answer;
    }

    requiredParams(): requiredConditionParamType[] {
        return [
            { 
                name: "ip", 
                required: true, 
                type: "string", 
                description: "The target IP address to send the UDP message to." 
            },
            { 
                name: "port", 
                required: true, 
                type: "number", 
                description: "The target port to send the UDP message to." 
            },
            { 
                name: "message", 
                required: true, 
                type: "string", 
                description: "The UDP message to send." 
            },
            { 
                name: "answer", 
                required: true, 
                type: "string", 
                description: "The expected UDP answer message." 
            },
        ];
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

            if (abortSignal.aborted) 
                return onAbort();
            

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
