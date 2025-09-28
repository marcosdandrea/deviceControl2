import { Condition } from "../..";
import { ConditionType, requiredConditionParamType } from "@common/types/condition.type";
import * as ping from "ping";
import { conditionTypes } from "..";
import dictionary from "@common/i18n";

interface ConditionPingParams extends Partial<ConditionType> {
    ipAddress: string;
    invertResult?: boolean;
    timeoutValue?: number;
}

export class ConditionPing extends Condition {
    static description = "Condition that pings an IP";
    static name = "Ping Condition"
    static type = conditionTypes.ping;

    ipAddress: string;
    invertResult: boolean;

    constructor(options: ConditionPingParams) {
        super({
            ...options,
            type: conditionTypes.ping,
            name: options.name || "Ping Condition",
            description: options.description || "Condition that pings an IP",
            timeoutValue: 10000
        } as ConditionType);

        this.validateParams();

        this.ipAddress = options.params.ipAddress;
        this.invertResult = options?.params?.invertResult === true;
    }

    requiredParams(): requiredConditionParamType[] {
        return [
            { 
                name: "ipAddress", 
                required: true, 
                validationMask: "^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$",
                type: "string", 
                description: "The target IP address to ping." 
            },
            { 
                name: "invertResult", 
                required: false, 
                validationMask: "",
                type: "boolean", 
                description: "If true, inverts the ping result." 
            }
        ];
    }

    protected async doEvaluation({ abortSignal }: { abortSignal: AbortSignal }): Promise<boolean> {
        const displayName = this.name || this.id;
        if (abortSignal.aborted) {
            return Promise.reject(new Error(dictionary("app.domain.entities.condition.evaluationAborted", displayName)));
        }

        return new Promise((resolve, reject) => {
            const pingPromise = ping.promise.probe(this.ipAddress, { timeout: 2 });
            let aborted = false;

            abortSignal.addEventListener("abort", () => {
                aborted = true;
                reject(new Error(dictionary("app.domain.entities.condition.evaluationAborted", displayName)));
            });

            pingPromise.then((res: any) => {
                if (aborted) return;
                const result = this.invertResult ? !res.alive : res.alive;
                if (result) {
                    resolve(true);
                } else {
                    reject(new Error(dictionary("app.domain.entities.condition.pingFailed", displayName)));
                }
            }).catch(reject);
        });
    }
}

export default ConditionPing;
