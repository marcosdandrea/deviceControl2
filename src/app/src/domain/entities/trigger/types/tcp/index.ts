import net from 'net';
import { Trigger } from '../..';
import triggerEvents from '@common/events/trigger.events';
import { TriggerType, TriggerTypes } from '@common/types/trigger.type';

interface TcpTriggerOptions extends TriggerType {
    port: number;
    ip?: string;
    message: string;
}

export class TcpTrigger extends Trigger {
    static type = 'tcp';
    static name = 'TCP Trigger';
    static description = 'Trigger that listens for TCP messages';

    port: number;
    ip: string;
    expectedMessage: string;
    server?: net.Server;

    constructor(options: TcpTriggerOptions) {
        super({
            ...options,
            type: TriggerTypes.tcp,
        });

        this.validateParams();
        /*

        if (typeof options.port !== 'number' || options.port <= 0 || options.port > 65535)
            throw new Error('Invalid port: must be between 1 and 65535');
        
        const ipMask = /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
        if (options.ip && !ipMask.test(options.ip))
        throw new Error('Invalid ip address');
        
        if (!options.message || typeof options.message !== 'string')
        throw new Error('Message must be a string');
        */

        this.port = options.port;
        this.ip = options.ip || '0.0.0.0';
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
        this.server = net.createServer(socket => {
            socket.on('data', data => {
                const msg = data.toString();
                if (msg.trim() === this.expectedMessage) {
                    this.trigger();
                }
            });
        });
        this.server.listen(this.port, this.ip, () => {
            this.logger.info(`TCP Trigger listening on ${this.ip}:${this.port}`);
        });
    }

    async destroy() {
        if (this.server) {
            this.server.close();
            this.server = undefined;
            this.logger.info('TCP Trigger server closed');
        }
    }
}

export default TcpTrigger;