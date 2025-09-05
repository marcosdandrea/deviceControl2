import { EventEmitter } from "events";
import { requiredTriggerParamType, TriggerInterface, TriggerType } from "@common/types/trigger.type";
import { Log } from "@src/utils/log";
import triggerEvents from "@common/events/trigger.events";
import { Context } from "../context";

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

        this.name = "Name must be set in subclass";
        this.description = "Description must be set in subclass";

        if (props.type && typeof props.type !== 'string')
            throw new Error("Trigger type must be a string");
        this.type = props.type;

        this.logger = Log.createInstance(`Trigger "${this.name}"`, true);
        this.params = props.params || {};

    }

    dispatchEvent(eventName: string, ...args: any[]): void {
        this.emit(eventName, ...args);
    }

    validateParams() {
        const requiredParams = this.requiredParams();
        
        for (const param of requiredParams) {
            const value = this.params ? this.params[param.name] : undefined;
            if (param.required && (value === undefined || value === null || value === "")) {
                throw new Error(`Missing required parameter: ${param.name}`);
            }
            if (value && param.validationMask) {
                const regex = new RegExp(param.validationMask);
                if (!regex.test(value)) {
                    throw new Error(`Parameter "${param.name}" is invalid. It must match the pattern: ${param.validationMask}`);
                }
            }
        }
    }

    requiredParams(): requiredTriggerParamType[] {
        throw new Error("Required parameters must be implemented in subclasses.");
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

        const origin = { 
            type: "trigger", 
            id: this.id, name: 
            this.name 
        }
        const ctx = Context.createRootContext(origin);

        this.triggered = true;
        this.dispatchEvent(triggerEvents.triggered, { ctx });
        this.logger.info(`${this.type.charAt(0).toUpperCase() + this.type.slice(1).toLowerCase()} trigger triggered [ctx: ${ctx.id}]`);
        ctx.log.info("Trigger activated");
        this.disarm();
        ctx.log.info("Trigger disarmed");

        if (!this.reArmOnTrigger)
            return

        this.arm();
        ctx.log.info("Trigger rearmed automatically");

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