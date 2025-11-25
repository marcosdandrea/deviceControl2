import wifiEvents from '@common/events/wifi.events';
import { WiFiConnectionStatus, WiFiNetwork } from '@common/types/wifi.types';
import WifiService, { WiFiConnectionResult, startWiFiMonitoring as initializeWifiMonitoring, stopWiFiMonitoring as finalizeWifiMonitoring, wifiEventEmitter } from '@src/services/hardwareManagement/wifi';
import { broadcastToClients } from '.';

const getAvailableNetworks = async (_payload: any, callback: Function): Promise<WiFiNetwork[]> => {
    const wifiNetworks = await WifiService.getAvailableNetworks()
    callback?.(wifiNetworks);
    return wifiNetworks;
}

const connectToNetwork = async (payload: { ssid: string; password: string }, callback?: Function): Promise<WiFiConnectionResult> => {
    const result = await WifiService.connectToNetwork(payload.ssid, payload.password);
    callback?.(result);
    return result;
}

const disconnectFromNetwork = async (_payload: any, callback: Function): Promise<void | { error: string}> => {
    try {
        const result = await WifiService.disconnectFromNetwork();
        callback?.(result);
        return result;
    } catch (error) {
        console.error("Error disconnecting from WiFi network:", error);
        callback?.({ error: error.message });
        return { error: error.message };
    }
}

const getConnectionStatus = async (_payload: any, callback: Function): Promise<WiFiConnectionStatus> => {
    const status = await WifiService.getConnectionStatus();
    callback?.(status);
    return status;
}

const forgetNetwork = async (payload: { ssid: string }, callback: Function): Promise<void> => {
    const result = await WifiService.forgetNetwork(payload.ssid);
    callback?.(result);
    return result;
}

const startWiFiMonitoring = (payload: any, callback: Function): void => {
    initializeWifiMonitoring();

    wifiEventEmitter.on(wifiEvents.wifiNetworksUpdated, (networks: WiFiNetwork[]) => {
        broadcastToClients(wifiEvents.wifiNetworksUpdated, networks);
    });

    wifiEventEmitter.on(wifiEvents.wifiStatusChanged, (status: WiFiConnectionStatus) => {
        broadcastToClients(wifiEvents.wifiStatusChanged, status);
    });
}

const stopWiFiMonitoring = (payload: any, callback: Function): void => {
    finalizeWifiMonitoring();
    wifiEventEmitter.removeAllListeners(wifiEvents.wifiNetworksUpdated);
    wifiEventEmitter.removeAllListeners(wifiEvents.wifiStatusChanged);
}

export default {
    getAvailableNetworks,
    connectToNetwork,
    disconnectFromNetwork,
    getConnectionStatus,
    forgetNetwork,
    startWiFiMonitoring,
    stopWiFiMonitoring,
}