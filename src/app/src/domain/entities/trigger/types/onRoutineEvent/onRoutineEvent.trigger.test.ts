import { describe, it, expect } from 'vitest';
import { OnRoutineEventTrigger } from './';
import { EventManager } from '@services/eventManager';
import triggerEvents from '@common/events/trigger.events';
import routineEvents from '@common/events/routine.events';

const ROUTINE_ID = 'routine-test';

describe('OnRoutineEventTrigger', () => {
    it('should trigger when matching routine event occurs', async () => {
        const trigger = new OnRoutineEventTrigger({ routineId: ROUTINE_ID, routineEvent: 'run', name: 'Test Trigger' });
        trigger.arm();
        const eventManager = new EventManager();

        await new Promise<void>((resolve, reject) => {
            trigger.on(triggerEvents.triggered, () => {
                try {
                    expect(trigger.triggered).toBe(true);
                    resolve();
                } catch (err) {
                    reject(err);
                }
            });
            eventManager.emit(routineEvents.routineRunning, { routineId: ROUTINE_ID });
        });

        trigger.disarm();
    });

    it('should not trigger when routine id does not match', async () => {
        const trigger = new OnRoutineEventTrigger({ routineId: ROUTINE_ID, routineEvent: 'run', name: 'Test Trigger' });
        trigger.arm();
        const eventManager = new EventManager();
        eventManager.emit(routineEvents.routineRunning, { routineId: 'other' });
        await new Promise(resolve => setTimeout(resolve, 100));
        expect(trigger.triggered).toBe(false);
        trigger.disarm();
    });
});
