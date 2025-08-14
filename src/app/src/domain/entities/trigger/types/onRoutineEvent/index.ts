import { Trigger } from '../..';
import { TriggerType, TriggerTypes } from '@common/types/trigger.type';
import triggerEvents from '@common/events/trigger.events';
import routineEvents from '@common/events/routine.events';
import { EventManager } from '@services/eventManager';
import { RoutineActions } from '@src/domain/entities/routine';

interface OnRoutineEventTriggerOptions extends TriggerType {
    routineId: string;
    routineEvent: RoutineActions;
}

export class OnRoutineEventTrigger extends Trigger {
    static type = 'onRoutineEvent';
    routineId: string;
    routineEvent: RoutineActions;
    private eventManager: EventManager;
    private boundHandler: ((payload: any) => void) | null = null;

    constructor(options: OnRoutineEventTriggerOptions) {
        super({
            ...options,
            type: TriggerTypes.onRoutineEvent,
            name: options.name || 'OnRoutineEvent Trigger',
            description: options.description || 'Trigger that listens for routine events',
        });

        if (!options.params.routineId || typeof options.params.routineId !== 'string')
            throw new Error('routineId must be a string');
        this.routineId = options.params.routineId;

        //if (!RoutineActions.includes(options.params.routineEvent))
        //    throw new Error(`routineEvent must be one of: ${RoutineActions.join(', ')}`);
        this.routineEvent = options.params.routineEvent;

        this.eventManager = new EventManager();

        this.on(triggerEvents.triggerArmed, this.init.bind(this));
        this.on(triggerEvents.triggerDisarmed, this.destroy.bind(this));
    }

private init() {
    const routineEvent = `routine.${this.routineId}.${this.routineEvent}`;
    if (!this.boundHandler) {
        this.boundHandler = this.trigger.bind(this); 
    }
    this.eventManager.addListener(routineEvent, this.boundHandler);
    this.logger.info(`Listening for routine ${this.routineId} event: ${this.routineEvent}`);
}

private destroy() {
    const routineEvent = `routine.${this.routineId}.${this.routineEvent}`;
    if (this.boundHandler) {
        this.eventManager.removeListener(routineEvent, this.boundHandler); // Usar la misma referencia
        this.logger.info(`Stopped listening for routine ${this.routineId} event: ${this.routineEvent}`);
        this.boundHandler = null; 
    }
}
}
