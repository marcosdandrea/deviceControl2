import { EventEmitter } from "events";
import { ConditionInterface, ConditionType, requiredConditionParamType } from "@common/types/condition.type";
import { Log } from "@src/utils/log";
import conditionEvents from "@common/events/condition.events";
import { Context } from "../context";

export class Condition extends EventEmitter implements ConditionInterface {

    id: string;
    name: string;
    description: string;
    type: string;
    timeoutValue: number;
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

        if (props?.params && typeof props.params !== 'object')
            throw new Error("Condition params must be an object");
        this.params = props.params || {};

        this.logger = Log.createInstance(`Condition "${this.name}"`, true);
        this.logger.info(`Condition created with ID "${this.id}"`);

    }

    #dispatchEvent(event: string, ...args: any[]): void {
        this.emit(event, ...args);
        if (args && args.length > 0)
            this.logger.info(`Event "${event}" dispatched with args:`, args);
        else
            this.logger.info(`Event "${event}" dispatched`);
    }

    validateParams(): void {
        const requiredParams = this.requiredParams();
        for (const param of requiredParams) {
            const value = this.params[param.name];
            if (param.required && (value === undefined || value === null)) {
                throw new Error(`Missing required parameter: ${param.name}`);
            }
            if (value !== undefined && value !== null) {
                if (param.type === "number" && typeof value !== "number") {
                    throw new Error(`Parameter "${param.name}" must be a number`);
                }
                if (param.type === "string" && typeof value !== "string") {
                    throw new Error(`Parameter "${param.name}" must be a string`);
                }
                if (param.validationMask) {
                    const regex = new RegExp(param.validationMask);
                    if (!regex.test(String(value))) {
                        throw new Error(`Parameter "${param.name}" does not match validation mask: ${param.validationMask}. Current value: ${value}`);
                    }
                }
            }
        }
        this.logger.info(`All parameters for job "${this.name}" are valid`);
    }

    requiredParams(): requiredConditionParamType[] {
        throw new Error("Required parameters must be implemented in subclasses.");
    }


    setTimeoutValue(timeout: number): void {
        if (typeof timeout !== 'number' || timeout < 0) {
            throw new Error("Timeout must be a positive number");
        }
        this.timeoutValue = timeout;
        this.logger.info(`Timeout set to ${timeout}ms for condition "${this.name}"`);
    }

    protected async doEvaluation({ abortSignal }: { abortSignal: AbortSignal }): Promise<boolean> {
        return Promise.reject("doEvaluation method not implemented");
    }

    /**
     * Evaluates the condition.
     * @param param0 - The context for evaluation.
     * @returns A promise that resolves to a boolean indicating the result of the evaluation.
     */
    async evaluate({ abortSignal, ctx }: { abortSignal: AbortSignal, ctx: Context }): Promise<boolean> {
        if (!abortSignal)
            throw new Error("AbortSignal is required to evaluate the condition");

        if (!(ctx instanceof Context))
            throw new Error("Ctx must be an instance of Context");

        try {
            await this.doEvaluation({ abortSignal });
            this.#dispatchEvent(conditionEvents.succeded);
            ctx.log.info(`Evaluation succeeded`, null);
            this.logger.info(`Evaluation succeeded`);
            return Promise.resolve(true);
        } catch (error) {
            this.logger.error(`Error during evaluation: ${error instanceof Error ? error.message : String(error)}`, error);
            ctx.log.error(`Error during evaluation: ${error instanceof Error ? error.message : String(error)}`, null);
            this.#dispatchEvent(conditionEvents.error, error);
            return Promise.reject(false);
        }
    }

    toJson(): ConditionType {
        return {
            id: this.id,
            name: this.name,
            description: this.description,
            type: this.type,
            params: this.params || {}
        };
    }

}