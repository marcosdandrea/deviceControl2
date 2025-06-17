import { Trigger } from '../..';
import { TriggerType } from '@common/types/trigger.type';
import { TriggerTypes } from '..';
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

        if (!options.routineId || typeof options.routineId !== 'string')
            throw new Error('routineId must be a string');
        this.routineId = options.routineId;

        if (!RoutineActions.includes(options.routineEvent))
            throw new Error(`routineEvent must be one of: ${RoutineActions.join(', ')}`);
        this.routineEvent = options.routineEvent;

        this.eventManager = new EventManager();

        this.on(triggerEvents.triggerArmed, this.init.bind(this));
        this.on(triggerEvents.triggerDisarmed, this.destroy.bind(this));
    }

    #mapEvent(action: RoutineActions): string {
        switch (action) {
            case 'enable':
                return routineEvents.routineEnabled;
            case 'disable':
                return routineEvents.routineDisabled;
            case 'run':
                return routineEvents.routineRunning;
            case 'stop':
                return routineEvents.routineAborted;
            default:
                return '';
        }
    }

    private init() {
        if (this.boundHandler) return;
        const eventName = this.#mapEvent(this.routineEvent);
        this.boundHandler = (payload: any) => {
            if (payload?.routineId === this.routineId) {
                this.trigger();
            }
        };
        this.eventManager.on(eventName, this.boundHandler);
    }

    private destroy() {
        if (!this.boundHandler) return;
        const eventName = this.#mapEvent(this.routineEvent);
        this.eventManager.off(eventName, this.boundHandler);
        this.boundHandler = null;
    }
}
