import { TaskInterface } from "@common/types/task.type";
import { Task } from "..";
import { SendUDPJob } from "../../job/types/sendUDP";
import ConditionPing from "../../conditions/types/ping";

export const wakeOnLanPresetTask = ({ macAddress, ip }:{macAddress: string, ip: string}): TaskInterface => {

    if (!macAddress || typeof macAddress !== 'string') {
        throw new Error("macAddress must be a valid string");
    }

    if (!/^([0-9A-Fa-f]{2}:){5}[0-9A-Fa-f]{2}$/.test(macAddress)) {
        throw new Error("macAddress must be a valid MAC address in format XX:XX:XX:XX:XX:XX");
    }

    if (!ip || typeof ip !== 'string') {
        throw new Error("ip must be a valid string");
    }

    if (!/^([0-9]{1,3}\.){3}[0-9]{1,3}$/.test(ip)) {
        throw new Error("ip must be a valid IPv4 address");
    }

    const WOLTask = new Task({
        name: "Wake on LAN",
        description: "Task to wake up a device using Wake on LAN protocol",
        checkConditionBeforeExecution: true,
        continueOnError: true,
        retries: 3,
        waitBeforeRetry: 15000
    })

    const WOLJob = new SendUDPJob({
        name: "Send Wake on LAN packet",
        description: "Job to send a Wake on LAN packet to the specified MAC address",
        type: "sendUDPJob",
        ipAddress: ip,
        portNumber: 9, // Default WOL port
        message: (() => {
            const macParts = macAddress.split(':');
            if (macParts.length !== 6 || !macParts.every(part => /^[0-9A-Fa-f]{2}$/.test(part))) {
                throw new Error("macAddress must be a valid MAC address in format XX:XX:XX:XX:XX:XX");
            }
            const macBytes = macParts.map(part => parseInt(part, 16));
            const magicPacket = Buffer.alloc(102, 0xFF);
            for (let i = 0; i < 6; i++) {
                magicPacket.writeUInt8(macBytes[i], 6 + i * 2);
            }
            return magicPacket.toString('hex');
        })()
    }) 

    WOLTask.setJob(WOLJob)

    const WOLCondition = new ConditionPing({
        name: "Check if device is reachable",
        description: "Condition to check if the device is reachable before sending WOL packet",
        ipAddress: ip,
        timeoutValue: 5000 // 5 seconds timeout
    });

    WOLTask.setCondition(WOLCondition);

    return WOLTask;
}