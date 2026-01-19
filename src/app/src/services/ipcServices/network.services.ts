import { NetworkConfiguration } from "@common/types/network";
import { Log } from "@src/utils/log";
import { error } from "console";

const log = Log.createInstance("Network IPC Service", true);

export const getNetworkStatus = async (_args: any, callback: Function) => {
    // Obtener la instancia del NetworkManager
    log.info("Getting network status...");
    try {
        const { NetworkManager } = await import("@src/services/hardwareManagement/net/index.js");
        const nm = NetworkManager.getInstance();
        if (!nm) {
            throw new Error("NetworkManager instance not initialized");
        }
        const networkStatus = await (await nm).getNetworkStatus()
        callback?.(networkStatus);
        return networkStatus;
    } catch (error) {
        log.error(`Error getting network status: ${(error as Error).message}`);
        callback?.(error);
        return null;
    }
}

export const setNetworkConfiguration = async (args: any, callback: Function) => {
    // Establecer la configuración de red
    log.info("Setting network configuration...");
    log.info("Received configuration:", JSON.stringify(args, null, 2));
    try {
        const config: NetworkConfiguration = args;
        if (!config) {
            throw new Error("No network configuration provided");
        }

        const { NetworkManager } = await import("@src/services/hardwareManagement/net/index.js");
        const networkManager = NetworkManager.getInstance();
        if (!networkManager) {
            throw new Error("NetworkManager instance not initialized");
        }

        await (await networkManager).setNetworkConfiguration(config);
        const err = null;
        callback?.(err, true);
        return true;
    } catch (error) {
        log.error(`Error setting network configuration: ${(error as Error).message}`);
        const err = (error as Error).message;
        callback?.(err, false);
        return false;
    }
}

export const refreshNetworkStatus = async (_args: any, callback: Function) => {
    // Forzar actualización del estado de red con reintentos
    log.info("Forcing network status refresh with retry...");
    try {
        const { NetworkManager } = await import("@src/services/hardwareManagement/net/index.js");
        const nm = NetworkManager.getInstance();
        if (!nm) {
            throw new Error("NetworkManager instance not initialized");
        }

        const networkManager = await nm;
        // Usar el nuevo método de reintento si está disponible
        if ('refreshNetworkStatusWithRetry' in networkManager) {
            await (networkManager as any).refreshNetworkStatusWithRetry();
        } else {
            // Fallback al método tradicional
            await (networkManager as any).refreshNetworkStatus();
        }
        
        const networkStatus = await networkManager.getNetworkStatus();
        callback?.(networkStatus);
        return networkStatus;
    } catch (error) {
        log.error(`Error refreshing network status: ${(error as Error).message}`);
        callback?.(error);
        return null;
    }
}

export default { getNetworkStatus, setNetworkConfiguration, refreshNetworkStatus }