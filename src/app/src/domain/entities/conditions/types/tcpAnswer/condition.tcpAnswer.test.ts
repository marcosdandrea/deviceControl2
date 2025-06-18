import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import ConditionTCPAnswer from './index';
import net from 'net';

describe('ConditionTCPAnswer', () => {
    let server: net.Server;
    beforeAll(() => {
        server = net.createServer(socket => {
            socket.on('data', data => {
                const msg = data.toString();
                const response = msg.includes('Hello') ? 'Ack' : 'No';
                socket.write(response);
            });
        });
        return new Promise<void>(resolve => server.listen(34567, '127.0.0.1', resolve));
    });

    afterAll(() => {
        server.close();
    });

    it('should resolve true when expected answer is received', async () => {
        const condition = new ConditionTCPAnswer({ ip: '127.0.0.1', port: 34567, message: 'Hello', answer: 'Ack' });
        const result = await condition.evaluate({ abortSignal: new AbortController().signal });
        expect(result).toBe(true);
    });

    it('should return false if aborted before evaluation', async () => {
        const condition = new ConditionTCPAnswer({ ip: '127.0.0.1', port: 34567, message: 'Hello', answer: 'Ack' });
        const controller = new AbortController();
        controller.abort();
        const result = await condition.evaluate({ abortSignal: controller.signal });
        expect(result).toBe(false);
    });

    it('should throw an error for invalid ip', () => {
        expect(() => new ConditionTCPAnswer({ ip: 'invalid-ip', port: 1, message: 'hi', answer: 'a' })).toThrow('Ip address must be a valid IPv4 address');
    });
});
