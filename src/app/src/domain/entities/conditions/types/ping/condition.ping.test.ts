import { describe, it, expect } from 'vitest';
import ConditionPing from './index';

describe('ConditionPing', () => {
    it('should resolve true when pinging localhost', async () => {
        const condition = new ConditionPing({ ip: '127.0.0.1', name: 'Ping Localhost' });
        const result = await condition.evaluate({ abortSignal: new AbortController().signal });
        expect(result).toBe(true);
    });

    it('should throw an error for invalid ip', () => {
        expect(() => new ConditionPing({ ip: 'invalid-ip', name: 'Invalid' })).toThrow('Ip address must be a valid IPv4 address');
    });

    it('should return false if aborted before evaluation', async () => {
        const condition = new ConditionPing({ ip: '127.0.0.1' });
        const controller = new AbortController();
        controller.abort();
        const result = await condition.evaluate({ abortSignal: controller.signal });
        expect(result).toBe(false);
    });
});
