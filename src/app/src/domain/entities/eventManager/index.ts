import {EventEmitter} from "events";
import { Log } from "@src/utils/log.js";


export class EventManager extends EventEmitter {
    private static instance: EventManager;
    public id: string;
    private logger: Log;

    constructor() {
        super();
        this.id = crypto.randomUUID();
        this.logger = new Log(`EventManager_${this.id}`, false);
        if (EventManager.instance)
            return EventManager.instance;

        EventManager.instance = this;
        this.logger.info(`EventManager instance created`);
    }

    emitEvent(eventName: string, data: object): void {
        this.logger.info(`Event emitted: ${eventName}`, data);
        this.emit(eventName, data);
    }

}

export const eventManager = new EventManager();

export default eventManager;