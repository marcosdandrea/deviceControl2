import { requiredTriggerParamType, TriggerType } from "@common/types/trigger.type";
import { Trigger } from "../..";
import { TriggerTypes } from "@common/types/trigger.type.js";
import triggerEvents from "@common/events/trigger.events";

interface cronTriggerType extends TriggerType {
    day: { value: number }; // 0-6, where 0 is Sunday and 6 is Saturday
    dayTime: { value: number }; // Time in milliseconds since midnight
}

export class CronTrigger extends Trigger {

    day: number;
    time: number;

    timeoutTimer: NodeJS.Timeout | null = null;
    rearmTimeout: NodeJS.Timeout | null = null;

    static easyName = "Por día y hora";
    static moduleDescription = "Se activa en un día y hora específicos de la semana.";

    constructor(props: cronTriggerType) {
        super({
            ...props,
            allowAutoRearming: true,
            type: TriggerTypes.cron
        });

        this.day = props.params.day.value;
        this.time = props.params.time.value || 0;

        this.on(triggerEvents.triggerArmed, this.#handleOnArm.bind(this));
        this.on(triggerEvents.triggerDisarmed, this.#handleOnDisarm.bind(this));
    }

    requiredParams(): Record<string, requiredTriggerParamType> {
        return {
            day: {
                easyName: "Día de la semana",
                options: ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"],
                type: "number",
                validationMask: "^(0|1|2|3|4|5|6)$",
                description: "Day of the week to trigger",
                required: true
            },
            time: {
                easyName: "Hora del día",
                description: "Time of day to trigger (HH:MM in 24-hour format)",
                defaultValue: "00:00",
                type: "time",
                validationMask: "^(?:\\d{1,7}|[1-7]\\d{7}|8[0-5]\\d{6}|86[0-3]\\d{5}|86400000)$",
                required: true
            }
        }
            ;
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
            this.logger.info(`Cron trigger armed for day ${this.day} at time ${this.#millisToTime(this.time)}`);
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
            targetDate.setMilliseconds(this.time);
            let timeToTrigger = targetDate.getTime() - now.getTime();

            if (timeToTrigger < 0) {
                this.logger.warn("Cron trigger time is in the past, adjusting to next week");
                targetDate.setDate(targetDate.getDate() + 7);
                timeToTrigger = targetDate.getTime() - now.getTime();
            }

            this.logger.info(`Cron trigger will fire at ${targetDate.toLocaleDateString()} ${targetDate.toLocaleTimeString()} (in ${Math.round(timeToTrigger / 1000)} seconds)`);
            this.timeoutTimer = setTimeout(() => {
                if (this.rearmTimeout)
                    clearTimeout(this.rearmTimeout);
                this.trigger();
                resolve();
                if (this.reArmOnTrigger) {
                    this.rearmTimeout = setTimeout(() => {
                        this.arm();
                    }, 60000);
                }
            }, timeToTrigger);
        });

    }

}

export default CronTrigger;