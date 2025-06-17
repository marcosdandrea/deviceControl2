import { describe, it, expect } from 'vitest';
import dgram from 'dgram';
import { UdpTrigger } from './';
import triggerEvents from '@common/events/trigger.events';

const TEST_PORT = 40101;

describe('UdpTrigger Tests', () => {
    it('should trigger on receiving the expected message', async () => {
        const trigger = new UdpTrigger({ port: TEST_PORT, message: 'ping' });
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

            const client = dgram.createSocket('udp4');
            client.send(Buffer.from('ping'), TEST_PORT, '127.0.0.1', () => {
                client.close();
            });
        });

        trigger.disarm();
    });
});
