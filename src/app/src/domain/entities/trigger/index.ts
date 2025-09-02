import { EventEmitter } from "events";
import { TriggerInterface, TriggerType } from "@common/types/trigger.type";
import { Log } from "@src/utils/log";
import triggerEvents from "@common/events/trigger.events";

export class Trigger extends EventEmitter implements TriggerInterface {
    id: TriggerInterface["id"];
    name: TriggerInterface["name"];
    description?: TriggerInterface["description"];
    type: TriggerInterface["type"];
    armed: boolean = false;
    triggered: boolean = false;
    reArmOnTrigger: boolean = true;
    logger: Log;
    params?: TriggerInterface["params"];

    constructor(props: TriggerType) {
        super();

        if (props.id && typeof props.id !== 'string')
            throw new Error("Trigger id must be a string");
        this.id = props.id || crypto.randomUUID();

        if (props.name && typeof props.name !== 'string')
            throw new Error("Trigger name must be a string");
        this.name = props.name;

        if (props.description && typeof props.description !== 'string')
            throw new Error("Trigger description must be a string");
        this.description = props.description || "";

        if (props.type && typeof props.type !== 'string')
            throw new Error("Trigger type must be a string");
        this.type = props.type;

        this.logger = new Log(`Trigger "${this.name}"`, true);
        this.params = props.params || {};

    }

    dispatchEvent(eventName: string, ...args: any[]): void {
        this.emit(eventName, ...args);
    }

    protected trigger(): void {

        if (!this.armed) {
            this.logger.warn("Trigger is not armed, cannot trigger");
            return;
        }

        if (this.triggered) {
            this.logger.warn("Trigger is already triggered");
            return;
        }

        this.logger.info("Triggering...");
        this.triggered = true;
        this.dispatchEvent(triggerEvents.triggered, { triggerId: this.id });
        this.logger.info(`${this.type.charAt(0).toUpperCase() + this.type.slice(1).toLowerCase()} trigger (id: ${this.id}) triggered`);
        this.disarm();

        if (!this.reArmOnTrigger)
            return

        this.logger.info("Rearming trigger after triggering");
        this.arm();

    }


    arm(): void {
        if (this.armed)
            this.logger.warn("Trigger is already armed");
        else {
            this.logger.info("Arming trigger...");
            this.armed = true;
            this.triggered = false;
            this.dispatchEvent(triggerEvents.triggerArmed, { triggerId: this.id });
        }
    }

    disarm(): void {
        if (!this.armed)
            this.logger.warn("Trigger is already disarmed");
        else {
            this.armed = false;
            this.dispatchEvent(triggerEvents.triggerDisarmed, { triggerId: this.id });
            this.logger.info("Trigger disarmed");
        }
    }


    toJson(): TriggerType {
        return {
            id: this.id,
            name: this.name,
            description: this.description,
            armed: this.armed,
            triggered: this.triggered,
            reArmOnTrigger: this.reArmOnTrigger,
            params: this.params,
            type: this.type
        };
    }

}