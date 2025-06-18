import { Condition } from "../..";
import { ConditionType } from "@common/types/condition.type";
import { exec } from "child_process";

interface ConditionPingParams extends Partial<ConditionType> {
    ipAddress: string;
    timeoutValue?: number;
}

export class ConditionPing extends Condition {
    ipAddress: string;
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
        if (!options.ipAddress || typeof options.ipAddress !== "string" || !ipMask.test(options.ipAddress))
            throw new Error("Ip address must be a valid IPv4 address");
        this.ipAddress = options.ipAddress;
    }

    protected async doEvaluation({ abortSignal }: { abortSignal: AbortSignal }): Promise<boolean> {
        if (abortSignal.aborted) {
            return Promise.reject(new Error("Condition evaluation aborted"));
        }

        return new Promise((resolve, reject) => {
            const command = process.platform === "win32" ? `ping -n 1 ${this.ipAddress}` : `ping -c 1 ${this.ipAddress}`;
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
