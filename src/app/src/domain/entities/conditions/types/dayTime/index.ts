import { conditionTypes } from "..";
import { Condition } from "../..";
import { ConditionType, requiredConditionParamType } from "@common/types/condition.type";
import dictionary from "@common/i18n";

interface ConditionDayTimeParams extends Partial<ConditionType> {
    day?: number;
    hour?: number;
    minute?: number;
    timeoutValue?: number;
}

export class ConditionDayTime extends Condition {
    static name = "Day Time Condition";
    static description = "Condition that checks day and time";
    static type = conditionTypes.dayTime;
    
    day?: number;
    hour?: number;
    minute?: number;

    constructor(options: ConditionDayTimeParams) {
        super({
            ...options,
            type: conditionTypes.dayTime,
            name: options.name || "Day Time Condition",
            description: options.params.description || "Condition that checks day and time",
            timeoutValue: options.params.timeoutValue
        } as ConditionType);

        this.validateParams();
        
        this.day = options.day;
        this.hour = options.hour;
        this.minute = options.minute;
    }

    requiredParams(): requiredConditionParamType[] {
        return [
            {
                name: "day",
                required: false,
                type: "number",
                validationMask: "^(0|1|2|3|4|5|6)$",
                description: "The target day of the week (0-6, 0 = Sunday)."
            },
            {
                name: "hour",
                required: false,
                type: "number",
                validationMask: "^(2[0-3]|[01]?[0-9])$",
                description: "The target hour of the day (0-23)."
            },
            {
                name: "minute",
                required: false,
                type: "number",
                validationMask: "^(5[0-9]|[0-4]?[0-9])$",
                description: "The target minute of the hour (0-59)."
            }
        ];
    }

    protected async doEvaluation({ abortSignal }: { abortSignal: AbortSignal }): Promise<boolean> {
        return new Promise((resolve, reject) => {
            const displayName = this.name || this.id;
            if (abortSignal.aborted) {
                return reject(new Error(dictionary("app.domain.entities.condition.evaluationAborted", displayName)));
            }
            const now = new Date();
            const dayMatch = this.day === undefined || now.getDay() === this.day;
            const hourMatch = this.hour === undefined || now.getHours() === this.hour;
            const minuteMatch = this.minute === undefined || now.getMinutes() === this.minute;

            if (dayMatch && hourMatch && minuteMatch) {
                resolve(true);
            } else {
                reject(new Error(dictionary("app.domain.entities.condition.notMet", displayName)));
            }
        });
    }
}

export default ConditionDayTime;
