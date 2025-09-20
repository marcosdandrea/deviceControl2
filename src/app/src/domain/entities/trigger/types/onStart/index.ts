import { Trigger } from '../..';
import { requiredTriggerParamType, TriggerType, TriggerTypes } from '@common/types/trigger.type';
import triggerEvents from '@common/events/trigger.events';

interface OnStartTriggerOptions extends TriggerType {
    delay?: number;
}

export class OnStartTrigger extends Trigger {
    static type = 'onStart';

    delay: number;
    private timeoutId: NodeJS.Timeout | null = null;
    static easyName = 'Al Iniciar';
    static moduleDescription = 'Se activa cuando la aplicación se inicia, con un retraso opcional.';
    static disableRearming = true;

    constructor(options: OnStartTriggerOptions) {
        super({
            ...options,
            reArmOnTrigger: false,
            disableRearming: true,
            type: TriggerTypes.onStart,
        });

        this.validateParams();
        /*
        if (options.delay !== undefined && (typeof options.delay !== 'number' || options.delay < 0))
            throw new Error('delay must be a non-negative number');
        */

        this.delay = Number(options.params?.delay?.value) ?? 0;

        this.on(triggerEvents.triggerArmed, this.init.bind(this));
        this.on(triggerEvents.triggerDisarmed, this.destroy.bind(this));
        this.timeoutId = null;
    }

    requiredParams(): Record<string, requiredTriggerParamType> {
        return {
            delay: {
                easyName: 'Retraso (ms)',
                type: 'number',
                validationMask: '^(0|[1-9][0-9]*)$',
                description: 'Delay in milliseconds before triggering after start (default 0)',
                required: false,
            }
        }
    }

    private init() {

        console.log("OnStartTrigger initialized with delay:", this.delay);
        if (this.timeoutId) 
            clearTimeout(this.timeoutId);

        if (this.delay <= 0) {
            this.trigger();
            return;
        }

        this.timeoutId = setTimeout(() => {
            clearTimeout(this.timeoutId!);
            this.trigger();
        }, this.delay);
    }

    private destroy() {
        if (this.timeoutId) {
            clearTimeout(this.timeoutId);
            this.timeoutId = null;
        }
    }
}

export default OnStartTrigger;