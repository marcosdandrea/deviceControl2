import { describe, it, expect } from 'vitest';
import dgram from 'dgram';
import { UdpTrigger } from './';
import triggerEvents from '@common/events/trigger.events';

const TEST_PORT = 40101;

describe('UdpTrigger Tests', () => {
    it('should trigger on receiving the expected message', async () => {
        const trigger = new UdpTrigger({ port: TEST_PORT, message: 'ping', name: 'Test UDP Trigger' });
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
    
    it('should trigger when receiving a message sended broadcast', async () => {
        const trigger = new UdpTrigger({ port: TEST_PORT, message: 'ping', name: 'Test UDP Trigger' });
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
            client.bind(() => {
                client.setBroadcast(true);
                client.send(Buffer.from('ping'), TEST_PORT, '255.255.255.255', () => {
                    client.close();
                });
            });
        });
        trigger.disarm();
        expect(trigger.triggered).toBe(true);
        expect(trigger.armed).toBe(false);
        expect(trigger.server).toBeUndefined();
    })
    it('should not trigger on receiving a different message', async () => {
        const trigger = new UdpTrigger({ port: TEST_PORT, message: 'ping', name: 'Test UDP Trigger' });
        trigger.arm();

        await new Promise<void>((resolve, reject) => {
            trigger.on(triggerEvents.triggered, () => {
                reject(new Error('Trigger should not have been activated'));
            });

            const client = dgram.createSocket('udp4');
            client.send(Buffer.from('pong'), TEST_PORT, 'this message should not trigger', () => {
                client.close();
                setTimeout(() => {
                    // Wait a bit to ensure the trigger did not activate
                    resolve();
                }, 1000);
            });
        }
        );
        trigger.disarm();
        expect(trigger.triggered).toBe(false);
        expect(trigger.armed).toBe(false);
        expect(trigger.server).toBeUndefined();
    });
});
