import { TaskInterface } from "@common/types/task.type";
import { Task } from "..";
import { SendUDPJob } from "../../job/types/sendUDP";
import ConditionPing from "../../conditions/types/ping";

export const wakeOnLanPresetTask = ({ macAddress, ipAddress, retries, port }: { macAddress: string, ipAddress: string, retries?: number, port?: number }): TaskInterface => {

    if (!macAddress || typeof macAddress !== 'string') {
        throw new Error("macAddress must be a valid string");
    }

    if (!/^([0-9A-Fa-f]{2}:){5}[0-9A-Fa-f]{2}$/.test(macAddress)) {
        throw new Error("macAddress must be a valid MAC address in format XX:XX:XX:XX:XX:XX");
    }

    if (!ipAddress || typeof ipAddress !== 'string') {
        throw new Error("ip must be a valid string");
    }

    if (!/^([0-9]{1,3}\.){3}[0-9]{1,3}$/.test(ipAddress)) {
        throw new Error("ip must be a valid IPv4 address");
    }

    const WOLTask = new Task({
        name: "Wake on LAN",
        description: "Task to wake up a device using Wake on LAN protocol",
        checkConditionBeforeExecution: true,
        continueOnError: true,
        retries: retries || 3,
        waitBeforeRetry: 20000
    })

    const WOLJob = new SendUDPJob({
        name: "Send Wake on LAN packet",
        description: "Job to send a Wake on LAN packet to the specified MAC address",
        type: "sendUDPJob",
        params: {
            ipAddress: "255.255.255.255",
            portNumber: port || 7, // Default WOL port
            subnetMask: "255.255.255.255",
            message: (() => {
                const macParts = macAddress.split(':');
                if (
                    macParts.length !== 6 ||
                    !macParts.every(part => /^[0-9A-Fa-f]{2}$/.test(part))
                ) {
                    throw new Error('macAddress must be XX:XX:XX:XX:XX:XX');
                }
                const macBytes = macParts.map(part => parseInt(part, 16));

                // Crear buffer (6 de cabecera + 16 × 6 = 102)
                const packet = Buffer.alloc(102);

                // Cabecera 0xFF * 6
                packet.fill(0xFF, 0, 6);

                // Copiar la MAC 16 veces seguidas
                for (let rep = 0; rep < 16; rep++) {
                    for (let i = 0; i < 6; i++) {
                        packet[6 + rep * 6 + i] = macBytes[i];
                    }
                }

                return packet;          // Buffer listo para enviar
            })()
        }
    })

    WOLTask.setJob(WOLJob)

    const WOLCondition = new ConditionPing({
        name: "Check if device is reachable",
        description: "Condition to check if the device is reachable before sending WOL packet",
        ipAddress: ipAddress
    });

    WOLCondition.setTimeoutValue(10000);
    WOLTask.setCondition(WOLCondition);

    return WOLTask;
}