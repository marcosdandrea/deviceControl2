import { dmxnet, SenderOptions, sender } from 'dmxnet';
import { Log } from '@src/utils/log';

const log = Log.createInstance('Artnet Service', true);

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
            try {
                sender = this.newSender(options);
                this.senderMap.set(key, sender);
                
                // Manejar errores del socket UDP
                if (sender && (sender as any).socket) {
                    (sender as any).socket.on('error', (err: any) => {
                        // Ignorar errores de red transitorios
                        if (err.code === 'ENETUNREACH' || err.code === 'ENETDOWN' || err.code === 'EHOSTUNREACH') {
                            log.warn(`Transient network error in Art-Net sender (${key}):`, err.message);
                        } else {
                            log.error(`Art-Net sender error (${key}):`, err);
                        }
                    });
                }
            } catch (err) {
                log.error('Failed to create Art-Net sender:', err);
                throw err;
            }
        }
        return sender;
    }
}

export default Artnet;
