import { Trigger } from "../..";
import { requiredTriggerParamType, TriggerType } from "@common/types/trigger.type";
import triggerEvents from "@common/events/trigger.events";
import { ServerManager } from "@src/services/server/serverManager";
import { NetworkManager } from "@src/services/hardwareManagement/net";
import { NetworkStatus } from "@common/types/network";

interface ApiInterface extends TriggerType {
    endpoint?: string; // Endpoint to listen for API requests
}

export class APITrigger extends Trigger {
    static type = "api";

    endpoint: string;
    static easyName = "Por solicitud API";
    static moduleDescription = "Se activa cuando se recibe una solicitud HTTP en un endpoint API específico.";

    constructor(options: ApiInterface) {

        super({
            ...options,
            type: APITrigger.type,
        })

        this.endpoint = options.params?.endpoint?.value || "";

        this.#initListeners()
    }

    async requiredParams(): Promise<Record<string, requiredTriggerParamType>> {

        let route = ""
        const mainServer = ServerManager.getInstance("general");

        const nm = NetworkManager.getInstance();
        const networkStatus = await (await nm).getNetworkStatus()
        if (networkStatus.status !== NetworkStatus.CONNECTED) {
           route = `http://LOCAL_IP:${mainServer.port}`;
        } else {
            route = `http://${networkStatus.ipv4Address}:${mainServer.port}`;
        }

        return {
            endpoint: {
                easyName: route,
                type: "string",
                validationMask: "^\\/([a-zA-Z0-9-_\\/]*)$",
                description: "API endpoint to listen for requests (e.g., /api/trigger)",
                required: true
            }
        };
    }

    #initListeners() {
        this.on(triggerEvents.triggerArmed, () => {
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

export default APITrigger;