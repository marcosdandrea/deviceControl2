import { WiFiConnectionStatus, WiFiNetwork } from '@common/types/wifi.types';
import WifiService, { startWiFiMonitoring } from '@src/services/hardwareManagement/wifi';

const getAvailableNetworks = async (_payload: any, callback: Function): Promise<WiFiNetwork[]> => {
    const wifiNetworks = await WifiService.getAvailableNetworks()
    callback?.(wifiNetworks);
    return wifiNetworks;
}

const connectToNetwork = async (payload: { ssid: string; password: string }, callback: Function): Promise<void> => {
    const result = await WifiService.connectToNetwork(payload.ssid, payload.password);
    callback?.(result);
    return result;
}

const disconnectFromNetwork = async (_payload: any, callback: Function): Promise<void> => {
    const result = await WifiService.disconnectFromNetwork();
    callback?.(result);
    return result;
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
    startWiFiMonitoring(payload, callback);
}

const stopWiFiMonitoring = (payload: any, callback: Function): void => {
    stopWiFiMonitoring(payload, callback);
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