import { Condition } from "../..";
import { ConditionType } from "@common/types/condition.type";
import * as ping from "ping";
import { conditionTypes } from "..";

interface ConditionPingParams extends Partial<ConditionType> {
    ipAddress: string;
    timeoutValue?: number;
}

export class ConditionPing extends Condition {
    ipAddress: string;
    static type: string

    constructor(options: ConditionPingParams) {
        super({
            ...options,
            type: conditionTypes.ping,
            name: options.name || "Ping Condition",
            description: options.description || "Condition that pings an IP",
            timeoutValue: 10000
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
            const pingPromise = ping.promise.probe(this.ipAddress, { timeout: 2 });
            let aborted = false;

            abortSignal.addEventListener("abort", () => {
                aborted = true;
                reject(new Error("Condition evaluation aborted"));
            });

            pingPromise.then((res: any) => {
                if (aborted) return;
                if (res.alive) {
                    resolve(true);
                } else {
                    reject(new Error("Ping failed: destination unreachable"));
                }
            }).catch(reject);
        });
    }
}

export default ConditionPing;
