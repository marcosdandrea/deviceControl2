import { Condition } from "../..";
import { ConditionType } from "@common/types/condition.type";
import { exec } from "child_process";

interface ConditionPingParams extends Partial<ConditionType> {
    ip: string;
    timeoutValue?: number;
}

export class ConditionPing extends Condition {
    ip: string;
    static type = "ping";

    constructor(options: ConditionPingParams) {
        super({
            ...options,
            type: ConditionPing.type,
            name: options.name || "Ping Condition",
            description: options.description || "Condition that pings an IP",
            timeoutValue: options.timeoutValue
        } as ConditionType);

        const ipMask = /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
        if (!options.ip || typeof options.ip !== "string" || !ipMask.test(options.ip))
            throw new Error("Ip address must be a valid IPv4 address");
        this.ip = options.ip;
    }

    protected async doEvaluation({ abortSignal }: { abortSignal: AbortSignal }): Promise<boolean> {
        if (abortSignal.aborted) {
            return Promise.reject(new Error("Condition evaluation aborted"));
        }

        return new Promise((resolve, reject) => {
            const command = process.platform === "win32" ? `ping -n 1 ${this.ip}` : `ping -c 1 ${this.ip}`;
            const child = exec(command, (error) => {
                if (error) {
                    return reject(error);
                }
                resolve(true);
            });

            abortSignal.addEventListener("abort", () => {
                child.kill();
                reject(new Error("Condition evaluation aborted"));
            });
        });
    }
}

export default ConditionPing;
