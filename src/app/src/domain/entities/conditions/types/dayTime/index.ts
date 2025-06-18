import { Condition } from "../..";
import { ConditionType } from "@common/types/condition.type";

interface ConditionDayTimeParams extends Partial<ConditionType> {
    day?: number;
    hour?: number;
    minute?: number;
    timeoutValue?: number;
}

export class ConditionDayTime extends Condition {
    static type = "dayTime";
    day?: number;
    hour?: number;
    minute?: number;

    constructor(options: ConditionDayTimeParams) {
        super({
            ...options,
            type: ConditionDayTime.type,
            name: options.name || "Day Time Condition",
            description: options.description || "Condition that checks day and time",
            timeoutValue: options.timeoutValue
        } as ConditionType);

        if (options.day === undefined && options.hour === undefined && options.minute === undefined) {
            throw new Error("At least one of day, hour or minute must be specified");
        }

        if (options.day !== undefined) {
            if (typeof options.day !== 'number' || options.day < 0 || options.day > 6) {
                throw new Error("day must be a number between 0 and 6");
            }
            this.day = options.day;
        }

        if (options.hour !== undefined) {
            if (typeof options.hour !== 'number' || options.hour < 0 || options.hour > 23) {
                throw new Error("hour must be a number between 0 and 23");
            }
            this.hour = options.hour;
        }

        if (options.minute !== undefined) {
            if (typeof options.minute !== 'number' || options.minute < 0 || options.minute > 59) {
                throw new Error("minute must be a number between 0 and 59");
            }
            this.minute = options.minute;
        }
    }

    protected async doEvaluation({ abortSignal }: { abortSignal: AbortSignal }): Promise<boolean> {
        return new Promise((resolve, reject) => {
            if (abortSignal.aborted) {
                return reject(new Error("Condition evaluation aborted"));
            }
            const now = new Date();
            const dayMatch = this.day === undefined || now.getDay() === this.day;
            const hourMatch = this.hour === undefined || now.getHours() === this.hour;
            const minuteMatch = this.minute === undefined || now.getMinutes() === this.minute;

            if (dayMatch && hourMatch && minuteMatch) {
                resolve(true);
            } else {
                reject(new Error("Condition not met"));
            }
        });
    }
}

export default ConditionDayTime;
