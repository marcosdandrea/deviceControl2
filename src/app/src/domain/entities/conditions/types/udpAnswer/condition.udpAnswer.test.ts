import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import ConditionUDPAnswer from './index';
import dgram from 'dgram';

describe('ConditionUDPAnswer', () => {
    let server: dgram.Socket;
    beforeAll(() => {
        server = dgram.createSocket('udp4');
        server.on('message', (msg, rinfo) => {
            const message = msg.toString();
            const response = message.includes('Hello') ? 'Ack' : 'No';
            server.send(response, rinfo.port, rinfo.address);
        });
        return new Promise<void>(resolve => server.bind(34568, '127.0.0.1', resolve));
    });

    afterAll(() => {
        server.close();
    });

    it('should resolve true when expected answer is received', async () => {
        const condition = new ConditionUDPAnswer({ ip: '127.0.0.1', port: 34568, message: 'Hello', answer: 'Ack' });
        const result = await condition.evaluate({ abortSignal: new AbortController().signal });
        expect(result).toBe(true);
    });

    it('should return false if aborted before evaluation', async () => {
        const condition = new ConditionUDPAnswer({ ip: '127.0.0.1', port: 34568, message: 'Hello', answer: 'Ack' });
        const controller = new AbortController();
        controller.abort();
        const result = await condition.evaluate({ abortSignal: controller.signal });
        expect(result).toBe(false);
    });

    it('should throw an error for invalid ip', () => {
        expect(() => new ConditionUDPAnswer({ ip: 'invalid', port: 1, message: 'a', answer: 'b' })).toThrow('Ip address must be a valid IPv4 address');
    });
});
