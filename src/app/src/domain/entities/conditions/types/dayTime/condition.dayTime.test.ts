import { describe, it, expect } from 'vitest';
import ConditionDayTime from './index';

describe('ConditionDayTime', () => {
    const now = new Date();

    it('should resolve true when current time matches parameters', async () => {
        const condition = new ConditionDayTime({
            day: now.getDay(),
            hour: now.getHours(),
            minute: now.getMinutes()
        });
        const result = await condition.evaluate({ abortSignal: new AbortController().signal });
        expect(result).toBe(true);
    });

    it('should return false when day does not match', async () => {
        const wrongDay = (now.getDay() + 1) % 7;
        const condition = new ConditionDayTime({ day: wrongDay });
        const result = await condition.evaluate({ abortSignal: new AbortController().signal });
        expect(result).toBe(false);
    });

    it('should throw an error if no parameters are provided', () => {
        expect(() => new ConditionDayTime({})).toThrow('At least one of day, hour or minute must be specified');
    });

    it('should return false if aborted before evaluation', async () => {
        const condition = new ConditionDayTime({ day: now.getDay() });
        const controller = new AbortController();
        controller.abort();
        const result = await condition.evaluate({ abortSignal: controller.signal });
        expect(result).toBe(false);
    });
});
