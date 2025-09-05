import dgram from 'dgram';
import { Trigger } from '../..';
import triggerEvents from '@common/events/trigger.events';
import { TriggerType, TriggerTypes } from '@common/types/trigger.type';

interface UdpTriggerOptions extends TriggerType {
    port: number;
    ip?: string;
    message: string;
}

export class UdpTrigger extends Trigger {
    static type = 'udp';
    static name = 'UDP Trigger';
    static description = 'Trigger that listens for UDP messages';

    port: number;
    ip: string;
    expectedMessage: string;
    server?: dgram.Socket;

    constructor(options: UdpTriggerOptions) {
        super({
            ...options,
            type: TriggerTypes.udp,
        });

        this.validateParams();

        this.ip = options.ip || '0.0.0.0';
        this.port = options.port;
        this.expectedMessage = options.message;

        this.on(triggerEvents.triggerArmed, this.init.bind(this));
        this.on(triggerEvents.triggerDisarmed, this.destroy.bind(this));
    }

    requiredParams() {
        return [
            {
                name: 'port',
                type: 'number',
                validationMask: '^(6553[0-5]|655[0-2][0-9]|65[0-4][0-9]{2}|6[0-4][0-9]{3}|[1-5][0-9]{4}|[1-9][0-9]{0,3}|0)$',
                description: 'Port number to listen on (1-65535)',
                required: true,
            },
            {
                name: 'ip',
                type: 'string',
                validationMask: '^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$',
                description: 'IP address to bind to (default: 0.0.0.0)',
                required: false,
            },
            {
                name: 'message',
                type: 'string',
                validationMask: '^.+$',
                description: 'Message to listen for',
                required: true,
            },
        ];
    }

    private init() {
        if (this.server)
            return;
        this.server = dgram.createSocket('udp4');
        this.server.on('message', msg => {
            const data = msg.toString();
            if (data.trim() === this.expectedMessage) {
                this.trigger();
            }
        });
        this.server.bind(this.port, this.ip, () => {
            this.logger.info(`UDP Trigger listening on ${this.ip}:${this.port}`);
        });
    }

    async destroy() {
        if (this.server) {
            this.server.close();
            this.server = undefined;
            this.logger.info('UDP Trigger socket closed');
        }
    }
}

export default UdpTrigger;