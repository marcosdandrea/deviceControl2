import { TriggerType } from "@common/types/trigger.type";
import { Trigger } from "../..";
import { TriggerTypes } from "@common/types/trigger.type.js";
import triggerEvents from "@common/events/trigger.events";

interface cronTriggerType extends TriggerType {
    day: number; // 0-6, where 0 is Sunday and 6 is Saturday
    dayTime: number; // Time in milliseconds since midnight
}

export class CronTrigger extends Trigger {

    day: number;
    dayTime: number;

    timeoutTimer: NodeJS.Timeout | null = null;

    constructor(params: cronTriggerType) {
        super({
            ...params,
            type: TriggerTypes.cron
        });

        if (typeof params.day !== 'number' || params.day < 0 || params.day > 6)
            throw new Error("Invalid day: must be a number between 0 (Sunday) and 6 (Saturday)")

        if (typeof params.dayTime !== 'number' || params.dayTime < 0 || params.dayTime >= 86400000)
            throw new Error("Invalid dayTime: must be a number between 0 and 86399999 (milliseconds in a day)")

        this.day = params.day;
        this.dayTime = params.dayTime || 0;

        this.on(triggerEvents.triggerArmed, this.#handleOnArm.bind(this));
        this.on(triggerEvents.triggerDisarmed, this.#handleOnDisarm.bind(this));
    }

    #millisToTime(millis: number): string {
        const date = new Date(millis);
        const hours = date.getUTCHours().toString().padStart(2, '0');
        const minutes = date.getUTCMinutes().toString().padStart(2, '0');
        return `${hours}:${minutes}`;
    }

    async #handleOnArm() {
        if (this.timeoutTimer) {
            clearTimeout(this.timeoutTimer);
            this.timeoutTimer = null;
            this.logger.info("Cron trigger armed, previous timeout cleared");
        } else {
            this.logger.info(`Cron trigger armed for day ${this.day} at time ${this.#millisToTime(this.dayTime)}`);
        }
        this.triggered = false

        try {
            await this.executeTest()
        } catch (error) {
            this.logger.error("Error while testing condition:", error);
            this.dispatchEvent(triggerEvents.triggerError, { triggerId: this.id, error });
        }
    }

    #cleanUpOnDisarm() {
        if (this.timeoutTimer) {
            clearTimeout(this.timeoutTimer);
            this.timeoutTimer = null;
            this.logger.info("Cron trigger disarmed, timeout cleared");
        } else {
            this.logger.warn("Cron trigger was not armed, no timeout to clear");
        }
    }

    #handleOnDisarm() {
        if (this.timeoutTimer) {
           this.#cleanUpOnDisarm();
            this.logger.info("Cron trigger disarmed, timeout cleared");
        } else {
            this.logger.warn("Cron trigger was not armed, no timeout to clear");
        }
        this.triggered = false;
    }

    executeTest(...args: any[]): Promise<void> {
        return new Promise((resolve, reject) => {
            //sets a timeout to be resolved when the time matches the cron trigger
            const now = new Date();
            const targetDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
            targetDate.setDate(targetDate.getDate() + ((this.day + 7 - targetDate.getDay()) % 7));
            targetDate.setMilliseconds(this.dayTime);
            const timeToTrigger = targetDate.getTime() - now.getTime();

            if (timeToTrigger < 0) {
                this.logger.warn("Cron trigger time is in the past, adjusting to next week");
                targetDate.setDate(targetDate.getDate() + 7);
            }

            this.logger.info(`Cron trigger will fire at ${targetDate.toISOString()}`);
            this.timeoutTimer = setTimeout(() => {
                this.trigger();
                resolve();
            }, timeToTrigger);
        });

    }

}