import net from 'net';
import { Trigger } from '../..';
import triggerEvents from '@common/events/trigger.events';
import { TriggerType } from '@common/types/trigger.type';
import { TriggerTypes } from '..';

interface TcpTriggerOptions extends TriggerType {
    port: number;
    ip?: string;
    message: string;
}

export class TcpTrigger extends Trigger {
    static type = 'tcp';
    port: number;
    ip: string;
    expectedMessage: string;
    server?: net.Server;

    constructor(options: TcpTriggerOptions) {
        super({
            ...options,
            type: TriggerTypes.tcp,
            name: options.name || 'TCP Trigger',
            description: options.description || 'Trigger that listens for TCP messages',
        });

        if (typeof options.port !== 'number' || options.port <= 0 || options.port > 65535)
            throw new Error('Invalid port: must be between 1 and 65535');
        this.port = options.port;

        const ipMask = /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
        if (options.ip && !ipMask.test(options.ip))
            throw new Error('Invalid ip address');
        this.ip = options.ip || '0.0.0.0';

        if (!options.message || typeof options.message !== 'string')
            throw new Error('Message must be a string');
        this.expectedMessage = options.message;

        this.on(triggerEvents.triggerArmed, this.init.bind(this));
        this.on(triggerEvents.triggerDisarmed, this.destroy.bind(this));
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
