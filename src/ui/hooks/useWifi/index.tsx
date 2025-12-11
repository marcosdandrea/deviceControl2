import wifiCommands from "@common/commands/wifi.commands";
import wifiEvents from "@common/events/wifi.events";
import { WiFiConnectionStatus, WiFiNetwork } from "@common/types/wifi.types";
import { SocketIOContext } from "@components/SocketIOProvider";
import { message } from "antd";
import { useContext, useEffect, useState, useCallback } from "react";

const useWifi = () => {
    
    const {socket} = useContext(SocketIOContext)
    const [wifiStatus, setWifiStatus] = useState<WiFiConnectionStatus>({ connected: false });
    const [availableNetworks, setAvailableNetworks] = useState<WiFiNetwork[]>([])

    const handleNetworksUpdate = useCallback((networks: WiFiNetwork[]) => {
        setAvailableNetworks(networks);
    }, []);

    const handleStatusChange = useCallback((status: WiFiConnectionStatus) => {
        setWifiStatus(status);
    }, []);

    const handleInitialStatus = useCallback((status: WiFiConnectionStatus) => {
        setWifiStatus(status);
    }, []);

    const handleInitialNetworks = useCallback((networks: WiFiNetwork[]) => {
        setAvailableNetworks(networks);
    }, []);

    useEffect(() => {
        if (!socket) return;

        socket.emit(wifiCommands.startWiFiMonitoring);

        socket.on(wifiEvents.wifiNetworksUpdated, handleNetworksUpdate);
        socket.on(wifiEvents.wifiStatusChanged, handleStatusChange);

        // Obtener el estado inicial de la conexión WiFi
        socket.emit(wifiCommands.getConnectionStatus, null, handleInitialStatus);
        socket.emit(wifiCommands.getAvailableNetworks, null, handleInitialNetworks);

        return () => {
            socket.off(wifiEvents.wifiNetworksUpdated, handleNetworksUpdate);
            socket.off(wifiEvents.wifiStatusChanged, handleStatusChange);
            socket.emit(wifiCommands.stopWiFiMonitoring);
        }
    }, [socket, handleNetworksUpdate, handleStatusChange, handleInitialStatus, handleInitialNetworks]);

    const disconnectWifi = useCallback(() => {
        if (!socket) return;
        message.warning(`Se va a desconectar el Wifi`)
        socket.emit(wifiCommands.disconnectFromNetwork);
    }, [socket]);

    const connectWifi = useCallback((ssid: string, password: string, callback?: (result: any) => void) => {
        if (!socket) return;
        socket.emit(wifiCommands.connectToNetwork, { ssid, password }, (result) => {
            if (result?.error){
                message.error(`Error conectando a la red Wifi`)
            }
            message.success(`Conexión exitosa a la red Wifi`)
            callback?.(result)
        });
    }, [socket]);

    return { wifiStatus, availableNetworks, disconnectWifi, connectWifi };
}
 
export default useWifi;