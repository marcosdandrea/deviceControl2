import { NetworkDeviceSummary } from "@common/types/network";
import { NetworkManagerService, networkEventEmitter, startNetworkMonitoring as initializeNetworkMonitoring, stopNetworkMonitoring as finalizeNetworkMonitoring } from "../hardwareManagement/net";
import { Log } from "@src/utils/log";
import networkEvents from "@common/events/network.events";
import { broadcastToClients } from ".";

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

type ApplySettingsPayload = {
    interfaceName: string;
    settings: {
        dhcp: boolean;
        ipv4: string;
        gateway: string;
        dns: string[];
    };
    connectionName?: string; // Optional: will be looked up if not provided
};

const applyInterfaceSettings = async (
    payload: ApplySettingsPayload,
    callback?: (response: { success: boolean; error?: string }) => void
) => {
    const { interfaceName, settings } = payload || ({} as ApplySettingsPayload);

    try {
        if (!interfaceName) throw new Error("No interfaceName provided");

        // Get the device info to find its connection name
        const allDevices = await NetworkManagerService.listDevices();
        const device = allDevices.find(d => d.device === interfaceName);
        
        if (!device) {
            throw new Error(`Device ${interfaceName} not found in network interfaces`);
        }

        const connectionName = device.connection;

        if (settings.dhcp) {
            await NetworkManagerService.setDHCP(interfaceName, connectionName);
        } else {
            // settings.ipv4 expected as "address/prefix" (e.g. 192.168.1.50/24)
            await NetworkManagerService.setStaticIP(
                interfaceName,
                settings.ipv4,
                settings.gateway,
                settings.dns || [],
                connectionName
            );
        }

        // Limpiar caché de dispositivos para que se refresque en la próxima consulta
        NetworkManagerService.clearDevicesCache();

        if (typeof callback === 'function') callback({ success: true });
    } catch (error) {
        log.error(`Error applying settings to interface ${interfaceName}: ${error}`);
        if (typeof callback === 'function') callback({ success: false, error: (error as Error).message });
    }
};

const startNetworkMonitoring = (payload: any, callback?: Function): void => {
    initializeNetworkMonitoring();

    networkEventEmitter.on(networkEvents.networkInterfacesChanged, (interfaces: NetworkDeviceSummary[]) => {
        broadcastToClients(networkEvents.networkInterfacesChanged, interfaces);
    });

    if (callback) callback({ success: true });
};

const stopNetworkMonitoring = (payload: any, callback?: Function): void => {
    finalizeNetworkMonitoring();
    networkEventEmitter.removeAllListeners(networkEvents.networkInterfacesChanged);
    
    if (callback) callback({ success: true });
};

export default { getNetworkInterfaces, applyInterfaceSettings, startNetworkMonitoring, stopNetworkMonitoring };