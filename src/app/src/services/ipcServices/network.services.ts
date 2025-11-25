import { NetworkDeviceSummary } from "@common/types/network";
import { NetworkManagerService } from "../hardwareManagement/net";
import { Log } from "@src/utils/log";

const log = Log.createInstance("Network IPC Service", true);

const getNetworkInterfaces = async (_payload: any, callback?: (devices: NetworkDeviceSummary[] | {error: string}) => void) => {
   
    try {
        const allDevices = await NetworkManagerService.listDevices();
        
        // Filtrar solo interfaces físicas (ethernet y wifi)
        const physicalDevices = allDevices.filter(device => 
            device.type === 'ethernet' || device.type === 'wifi'
        );
        
        log.info(`Retrieved ${physicalDevices.length} physical network devices (filtered from ${allDevices.length} total).`);
        
        if (typeof callback === 'function') {
            callback(physicalDevices);
        } else {
            console.error("Callback is not a function:", callback);
        }
    } catch (error) {
        log.error("Error retrieving network devices:", error);
        if (typeof callback === 'function') {
            callback({ error: (error as Error).message });
        }
    }
}

export default { getNetworkInterfaces };