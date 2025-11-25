import wifiCommands from "@common/commands/wifi.commands";
import wifiEvents from "@common/events/wifi.events";
import { WiFiConnectionStatus, WiFiNetwork } from "@common/types/wifi.types";
import { SocketIOContext } from "@components/SocketIOProvider";
import { useContext, useEffect, useState } from "react";

const useWifi = () => {
    
    const {socket} = useContext(SocketIOContext)
    const [wifiStatus, setWifiStatus] = useState<WiFiConnectionStatus>({ connected: false });
    const [availableNetworks, setAvailableNetworks] = useState<WiFiNetwork[]>([])

    useEffect(() => {
        if (!socket) return;

        socket.emit(wifiCommands.startWiFiMonitoring);

        socket.on(wifiEvents.wifiNetworksUpdated, (networks: WiFiNetwork[]) => {
            setAvailableNetworks(networks);
        });

        socket.on(wifiEvents.wifiStatusChanged, (status: WiFiConnectionStatus) => {
            setWifiStatus(status);
        });

        // Obtener el estado inicial de la conexión WiFi
        socket.emit(wifiCommands.getConnectionStatus, null, (status: WiFiConnectionStatus) => {
            setWifiStatus(status);
        });

        socket.emit(wifiCommands.getAvailableNetworks, null, (networks: WiFiNetwork[]) => {
            setAvailableNetworks(networks);
        });

        return () => {
            socket.off(wifiEvents.wifiNetworksUpdated);
            socket.off(wifiEvents.wifiStatusChanged);
            socket.emit(wifiCommands.stopWiFiMonitoring);
        }

    }, [socket]);

    const disconnectWifi = () => {
        if (!socket) return;
        socket.emit(wifiCommands.disconnectFromNetwork);
    }

    const connectWifi = (ssid: string, password: string, callback?: (result: any) => void) => {
        if (!socket) return;
        socket.emit(wifiCommands.connectToNetwork, { ssid, password }, callback);
    }

    return { wifiStatus, availableNetworks, disconnectWifi, connectWifi };
}
 
export default useWifi;