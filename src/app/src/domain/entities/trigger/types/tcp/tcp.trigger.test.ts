import { describe, it, expect } from 'vitest';
import net from 'net';
import { TcpTrigger } from './';
import triggerEvents from '@common/events/trigger.events';

const TEST_PORT = 40100;

describe('TcpTrigger Tests', () => {
    it('should trigger on receiving the expected message', async () => {
        const trigger = new TcpTrigger({ port: TEST_PORT, message: 'ping' });
        trigger.arm();

        await new Promise<void>((resolve, reject) => {
            trigger.on(triggerEvents.triggered, () => {
                try {
                    expect(trigger.triggered).toBe(true);
                    resolve();
                } catch (err) {
                    reject(err);
                }
            });

            const client = new net.Socket();
            client.connect(TEST_PORT, '127.0.0.1', () => {
                client.write('ping');
                client.end();
            });
        });

        trigger.disarm();
    });
});
