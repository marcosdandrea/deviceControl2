import { describe, it, expect } from 'vitest';
import { OnStartTrigger } from './';
import triggerEvents from '@common/events/trigger.events';

describe('OnStartTrigger', () => {
    it('should trigger immediately when instantiated without delay', async () => {
        const trigger = new OnStartTrigger({ name: 'Test Start Trigger' });

        await new Promise<void>((resolve, reject) => {
            trigger.on(triggerEvents.triggered, () => {
                try {
                    expect(trigger.triggered).toBe(true);
                    resolve();
                } catch (err) {
                    reject(err);
                }
            });
        });
    });

    it('should trigger after a given delay', async () => {
        const trigger = new OnStartTrigger({ delay: 50, name: 'Delayed Start Trigger' });

        await new Promise<void>((resolve, reject) => {
            trigger.on(triggerEvents.triggered, () => {
                try {
                    expect(trigger.triggered).toBe(true);
                    resolve();
                } catch (err) {
                    reject(err);
                }
            });
        });
    });
});
