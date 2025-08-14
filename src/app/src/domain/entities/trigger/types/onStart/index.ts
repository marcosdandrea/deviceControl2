import { Trigger } from '../..';
import { TriggerType, TriggerTypes } from '@common/types/trigger.type';
import triggerEvents from '@common/events/trigger.events';

interface OnStartTriggerOptions extends TriggerType {
    delay?: number;
}

export class OnStartTrigger extends Trigger {
    static type = 'onStart';
    delay: number;
    private timeoutId: NodeJS.Timeout | null = null;

    constructor(options: OnStartTriggerOptions = { name: 'OnStart Trigger' }) {
        super({
            ...options,
            type: TriggerTypes.onStart,
            name: options.name || 'OnStart Trigger',
            description: options.description || 'Trigger that fires on start',
        });

        if (options.delay !== undefined && (typeof options.delay !== 'number' || options.delay < 0))
            throw new Error('delay must be a non-negative number');

        this.delay = options.delay ?? 0;

        this.on(triggerEvents.triggerArmed, this.init.bind(this));
        this.on(triggerEvents.triggerDisarmed, this.destroy.bind(this));
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
