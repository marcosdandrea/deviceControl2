import { Trigger } from "../..";
import { TriggerType } from "@common/types/trigger.type";
import triggerEvents from "@common/events/trigger.events";
import { ServerManager } from "@src/services/server/serverManager";

interface ApiInterface extends TriggerType {
    endpoint?: string; // Endpoint to listen for API requests
}

export class APITrigger extends Trigger {
    static type = "api";
    endpoint: string;

    constructor(options: ApiInterface) {

        super({
            ...options,
            type: APITrigger.type,
            name: options.name || "API Trigger",
            description: options.description || "Trigger that listens to API requests",
        })

        this.endpoint = options.params?.endpoint || "";

        this.#initListeners()
    }

    #initListeners() {
        this.on(triggerEvents.triggerArmed, ()=> {
            this.logger.info(`API Trigger armed at endpoint: ${this.endpoint}`);
            this.init().catch(error => {
                this.logger.error("Error initializing API Trigger:", error);
            });
        })

        this.on(triggerEvents.triggerDisarmed, () => {
            this.logger.info(`API Trigger disarmed at endpoint: ${this.endpoint}`);
            this.destroy().catch(error => {
                this.logger.error("Error destroying API Trigger:", error);
            });
        });

    }

    #handleOnTrigger = async (req: any, res: any) => {
        this.trigger();
        res.status(200).send({ message: "Trigger activated" });
    }

    private async init() {

        if (!this.armed) 
            return this.logger.warn("API Trigger is not armed, skipping initialization");

        if (!this.endpoint) {
            throw new Error("API Trigger requires an endpoint to listen for requests");
        }

        const generalServer = await ServerManager.getInstance("general");

        try {
            generalServer.bindRoute(this.endpoint, this.#handleOnTrigger.bind(this));
            this.logger.info(`API Trigger initialized at endpoint: ${this.endpoint}`);
        } catch (error) {
            this.logger.error(`Failed to bind API trigger to endpoint ${this.endpoint}:`, error);
            throw new Error(`Failed to bind API trigger: ${error.message}`);
        }

    }

    async destroy(): Promise<void> {
        this.logger.info(`Destroying API Trigger at endpoint: ${this.endpoint}`);
        try {
            const generalServer = await ServerManager.getInstance("general");
            generalServer.unbindRoute(this.endpoint);
        } catch (e) {
            this.logger.error(`Failed to unbind API trigger from endpoint ${this.endpoint}:`, e);
            throw new Error(`Failed to unbind API trigger: ${e.message}`);
        }
    }
}