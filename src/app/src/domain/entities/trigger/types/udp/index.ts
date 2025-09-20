import dgram from 'dgram';
import { Trigger } from '../..';
import triggerEvents from '@common/events/trigger.events';
import { requiredTriggerParamType, TriggerType, TriggerTypes } from '@common/types/trigger.type';
import systemCommands from '@common/commands/system.commands';

interface UdpTriggerOptions extends TriggerType {
    port: number;
    ip?: string;
    message: string;
}

export class UdpTrigger extends Trigger {
    static type = 'udp';

    port: number;
    ip: string;
    expectedMessage: string;
    static easyName = 'por mensaje UDP';
    static moduleDescription = 'Escucha un mensaje UDP específico en una IP y puerto dados para activar una acción.';
    server?: dgram.Socket;

    constructor(options: UdpTriggerOptions) {
        super({
            ...options,
            type: TriggerTypes.udp,
        });

        this.validateParams();

        this.ip = options.params.ip?.value || '0.0.0.0';
        this.port = options.params.port?.value;
        this.expectedMessage = options.params.message?.value;

        this.on(triggerEvents.triggerArmed, this.init.bind(this));
        this.on(triggerEvents.triggerDisarmed, this.destroy.bind(this));
    }

    requiredParams(): Record<string, requiredTriggerParamType> {
        return {
            port: {
                type: 'number',
                easyName: 'Puerto',
                testAction: systemCommands.checkUDPPortAvailability,
                validationMask: '^(6553[0-5]|655[0-2][0-9]|65[0-4][0-9]{2}|6[0-4][0-9]{3}|[1-5][0-9]{4}|[1-9][0-9]{0,3}|0)$',
                description: 'Port number to listen on (1-65535)',
                required: true,
            },
            message: {
                type: 'string',
                easyName: 'Mensaje',
                validationMask: '^.+$',
                description: 'Message to listen for',
                required: true,
            },
        }
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
        this.server.on('error', (err) => {
            this.logger.error(`UDP Trigger socket error: ${err.message}`);
            this.server?.close();
            this.server = undefined;
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