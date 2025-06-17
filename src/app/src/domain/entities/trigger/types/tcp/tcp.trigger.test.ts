import { describe, it, expect } from 'vitest';
import net from 'net';
import { TcpTrigger } from './';
import triggerEvents from '@common/events/trigger.events';

const TEST_PORT = 40100;

describe('TcpTrigger Tests', () => {
    it('should trigger on receiving the expected message', async () => {
        const trigger = new TcpTrigger({ port: TEST_PORT, message: 'ping', name: 'Test TCP Trigger' });
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

    it('should not trigger on receiving a different message', async () => {
        const trigger = new TcpTrigger({ port: TEST_PORT, message: 'ping', name: 'Test TCP Trigger' });
        trigger.arm();

        await new Promise<void>((resolve, reject) => {
            trigger.on(triggerEvents.triggered, () => {
                reject(new Error('Trigger should not have been activated'));
            });

            const client = new net.Socket();
            client.connect(TEST_PORT, 'localhost', () => {
                client.write('pong');
                client.end();
            });
            setTimeout(() => {
                try {
                    expect(trigger.triggered).toBe(false);
                    resolve();
                } catch (err) {
                    reject(err);
                }
            }, 1000); // Wait for 1 second to ensure no trigger event is fired
        });
        trigger.disarm();
        expect(trigger.triggered).toBe(false);
        expect(trigger.armed).toBe(false);
        expect(trigger.server).toBeUndefined();
    });
});
