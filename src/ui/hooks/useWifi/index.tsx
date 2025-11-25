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

        return () => {
            socket.off(wifiEvents.wifiNetworksUpdated);
            socket.off(wifiEvents.wifiStatusChanged);
            socket.emit(wifiCommands.stopWiFiMonitoring);
        }

    }, [socket]);

    return { wifiStatus, availableNetworks };
}
 
export default useWifi;