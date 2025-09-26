import { Trigger } from '../..';
import { requiredTriggerParamType, TriggerType, TriggerTypes } from '@common/types/trigger.type';
import triggerEvents from '@common/events/trigger.events';
import { EventManager } from '@src/services/eventManager';
import { RoutineActions } from '@src/domain/entities/routine';

type routineEvents = "running" | "checking" | "completed" | "failed" | "aborted" | "timeout" | "unknown";

interface OnRoutineEventTriggerOptions extends TriggerType {
    routineId: string;
    routineEvent: routineEvents;
}

const rutineEventsEnum = ["running", "checking", "completed", "failed", "aborted", "timeout", "unknown"] as unknown as routineEvents

export class OnRoutineEventTrigger extends Trigger {
    static type = 'onRoutineEvent';

    routineId: string;
    routineEvent: RoutineActions;
    private eventManager: EventManager;
    private boundHandler: ((payload: any) => void) | null = null;
    static easyName = 'Por Evento de Rutina';
    static moduleDescription = 'Se activa cuando una rutina específica cambia de estado (ejecutando, comprobando, completada, fallida, abortada, desconocida).';

    constructor(options: OnRoutineEventTriggerOptions) {
        super({
            ...options,
            type: TriggerTypes.onRoutineEvent,
        });

        this.validateParams();
        /*
        if (!options.params.routineId || typeof options.params.routineId !== 'string')
            throw new Error('routineId must be a string');
        this.routineId = options.params.routineId;
        */
        //if (!RoutineActions.includes(options.params.routineEvent))
        //    throw new Error(`routineEvent must be one of: ${RoutineActions.join(', ')}`);
        this.routineEvent = rutineEventsEnum[options.params.routineEvent?.value];
        this.routineId = options.params.routineId?.value;

        this.eventManager = new EventManager();

        this.on(triggerEvents.triggerArmed, this.init.bind(this));
        this.on(triggerEvents.triggerDisarmed, this.destroy.bind(this));
    }

    requiredParams(): Record<string, requiredTriggerParamType> {
        return {
            routineId: {
                options: "routinesID",
                easyName: 'Nombre de la Rutina',
                type: 'string',
                validationMask: '^[a-zA-Z0-9-_]+$',
                description: 'ID of the routine to listen for events',
                required: true,
            },
            routineEvent: {
                easyName: 'Evento de la Rutina',
                options: ["running", "checking", "completed", "failed", "aborted", "timeout", "unknown"],
                type: 'string',
                validationMask: '^(0|1|2|3|4|5|6)$',
                description: 'Event of the routine to listen for (running, checking, completed, failed, aborted, unknown)',
                required: true,
            }
        }
    }

    private init() {
        const routineEvent = `routine.${this.routineId}.routine:${this.routineEvent}`;
        if (!this.boundHandler) {
            this.boundHandler = this.trigger.bind(this);
        }
        this.eventManager.addListener(routineEvent, this.boundHandler);
        this.logger.info(`Listening for routine ${this.routineId} event: ${this.routineEvent}`);
    }

    private destroy() {
        const routineEvent = `routine.${this.routineId}.routine:${this.routineEvent}`;
        if (this.boundHandler) {
            this.eventManager.removeListener(routineEvent, this.boundHandler); // Usar la misma referencia
            this.logger.info(`Stopped listening for routine ${this.routineId} event: ${this.routineEvent}`);
            this.boundHandler = null;
        }
    }
}

export default OnRoutineEventTrigger;