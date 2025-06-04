import { dmxnet, SenderOptions, Sender } from 'dmxnet';

class Artnet extends dmxnet {
    private static instance: Artnet | null = null;
    private senders: Map<string, Sender> = new Map();

    private constructor() {
        super();
    }

    static getInstance(): Artnet {
        if (!Artnet.instance) {
            Artnet.instance = new Artnet();
        }
        return Artnet.instance;
    }

    getSender(options: SenderOptions): Sender {
        const key = `${options.ip || '255.255.255.255'}:${options.port ?? ''}:${options.net}:${options.subnet}:${options.universe}`;
        let sender = this.senders.get(key);
        if (!sender) {
            sender = this.newSender(options);
            this.senders.set(key, sender);
        }
        return sender;
    }
}

export default Artnet;
