import { dmxnet, SenderOptions, sender } from 'dmxnet';

class Artnet extends dmxnet {
    private static instance: Artnet | null = null;
    private senderMap: Map<string, sender> = new Map();

    private constructor() {
        super({
            sName: "Device Control",
            lName: "Device Control",
        })
    }

    static getInstance(): Artnet {
        if (!Artnet.instance) {
            Artnet.instance = new Artnet();
        }
        return Artnet.instance;
    }

    getSender(options: SenderOptions): sender {
        const key = `${options.ip || '255.255.255.255'}:${options.port ?? ''}:${options.net}:${options.subnet}:${options.universe}`;
        let sender = this.senderMap.get(key);
        if (!sender) {
            sender = this.newSender(options);
            this.senderMap.set(key, sender);
        }
        return sender;
    }
}

export default Artnet;
