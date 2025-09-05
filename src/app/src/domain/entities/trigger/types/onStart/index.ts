import { Trigger } from '../..';
import { TriggerType, TriggerTypes } from '@common/types/trigger.type';
import triggerEvents from '@common/events/trigger.events';

interface OnStartTriggerOptions extends TriggerType {
    delay?: number;
}

export class OnStartTrigger extends Trigger {
    static type = 'onStart';
    static name = 'OnStart Trigger';
    static description = 'Trigger that fires on start within an optional delay';

    delay: number;
    private timeoutId: NodeJS.Timeout | null = null;

    constructor(options: OnStartTriggerOptions = { name: 'OnStart Trigger' }) {
        super({
            ...options,
            type: TriggerTypes.onStart,
        });

        this.validateParams();
        /*
        if (options.delay !== undefined && (typeof options.delay !== 'number' || options.delay < 0))
            throw new Error('delay must be a non-negative number');
        */

        this.delay = options.delay ?? 0;

        this.on(triggerEvents.triggerArmed, this.init.bind(this));
        this.on(triggerEvents.triggerDisarmed, this.destroy.bind(this));
    }

    requiredParams() {
        return [
            {
                name: 'delay',
                type: 'number',
                validationMask: '^(0|[1-9][0-9]*)$',
                description: 'Delay in milliseconds before triggering after start (default 0)',
                required: false,
            },
        ];
    }

    private init() {
        if (this.timeoutId) return;
        this.timeoutId = setTimeout(() => {
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