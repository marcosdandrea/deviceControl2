import { EventEmitter } from "events";
import { ConditionInterface, ConditionType } from "@common/types/condition.type";
import { Log } from "@src/utils/log";
import conditionEvents from "@common/events/condition.events";

export class Condition extends EventEmitter implements ConditionInterface {

    id: string;
    name: string;
    description: string;
    type: string;
    timeoutValue: number;
    timeout: NodeJS.Timeout | null = null;
    params: Record<string, any>;

    logger: Log

    constructor(props: ConditionType) {
        super();
        if (props?.id && typeof props.id !== 'string')
            throw new Error("Condition id must be a string");
        this.id = props.id || crypto.randomUUID();

        if (props?.name && typeof props.name !== 'string')
            throw new Error("Condition name must be a string");
        this.name = props.name;

        this.description = props?.description || "";

        if (!props.type || typeof props.type !== 'string')
            throw new Error("Condition type must be a string");
        this.type = props.type;

        this.timeoutValue = props?.timeoutValue || 5000; // Default timeout is 5000ms (5 seconds)

        if (props?.params && typeof props.params !== 'object')
            throw new Error("Condition params must be an object");
        this.params = props.params || {};
        
        this.logger = new Log(`Condition "${this.name}"`, true);
        this.logger.info(`Condition created with ID "${this.id}"`);

    }

    #dispatchEvent(event: string, ...args: any[]): void {
        this.emit(event, ...args);
        this.logger.info(`Event "${event}" dispatched with args:`, args);
    }

    setTimeoutValue(timeout: number): void {
        if (typeof timeout !== 'number' || timeout < 0) {
            throw new Error("Timeout must be a positive number");
        }
        this.timeoutValue = timeout;
        this.logger.info(`Timeout set to ${timeout}ms for condition "${this.name}"`);
    }

    protected async abortTimeout({ abortSignal }: { abortSignal: AbortSignal }): Promise<void> {
        return new Promise((_resolve, reject) => {

            this.timeout = setTimeout(() => {
                this.#dispatchEvent(conditionEvents.timeout);
                reject();
            }, this.timeoutValue);

            abortSignal.onabort = () => {
                if (this.timeout) {
                    clearTimeout(this.timeout);
                    this.timeout = null;
                }
                this.#dispatchEvent(conditionEvents.aborted);
                reject();
            }
        })
    }

    protected async doEvaluation({ abortSignal }: { abortSignal: AbortSignal }): Promise<boolean> {
        return Promise.reject("doEvaluation method not implemented");
    }

    async evaluate({ abortSignal }: { abortSignal: AbortSignal }): Promise<boolean> {
        try {
            await Promise.race([
                this.abortTimeout({ abortSignal }),
                this.doEvaluation({ abortSignal })
            ])
            if (this.timeout) {
                clearTimeout(this.timeout);
                this.timeout = null;
            }
            this.#dispatchEvent(conditionEvents.succeded);
            this.logger.info(`Condition "${this.name}" evaluation succeeded`);
            return true
        } catch (error) {
            this.logger.error("Error during evaluation:", error);
            this.#dispatchEvent(conditionEvents.error, error);
            return false;
        }
    }

    toJson(): ConditionType {
        return {
            id: this.id,
            name: this.name,
            description: this.description,
            type: this.type,
            timeoutValue: this.timeoutValue,
            params: this.params || {}
        };
    }

}