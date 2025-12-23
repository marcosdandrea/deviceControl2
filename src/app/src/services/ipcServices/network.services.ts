import { NetworkConfiguration } from "@common/types/network";
import { Log } from "@src/utils/log";

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
        const networkStatus = (await nm).getNetworkStatus()
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
    try {
        const config: NetworkConfiguration = args?.config;
        if (!config) {
            throw new Error("No network configuration provided");
        }

        const { NetworkManager } = await import("@src/services/hardwareManagement/net/index.js");
        const networkManager = NetworkManager.getInstance();
        if (!networkManager) {
            throw new Error("NetworkManager instance not initialized");
        }

        await networkManager.setNetworkConfiguration(config);
        callback?.(true);
        return true;
    } catch (error) {
        log.error(`Error setting network configuration: ${(error as Error).message}`);
        callback?.(false);
        return false;
    }
}

export default { getNetworkStatus, setNetworkConfiguration }