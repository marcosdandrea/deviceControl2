import React, { useContext, useEffect } from "react";
import { Input } from "antd";
import { WifiContext, wifiContextType } from "../../context";

const ConnectionStatus = () => {
    const {availableNetworks} = useContext(WifiContext) as wifiContextType
    const [connectionStatus, setConnectionStatus] = React.useState<string>("desconocido");

    useEffect(() => {
        const currentWifi = availableNetworks.find(network => network.inUse);
        if (currentWifi) {
            setConnectionStatus(`Conectado a ${currentWifi.ssid}, calidad de señal: ${currentWifi.signal}%`);
        }
        else {
            setConnectionStatus("Desconectado");
        }
    }, [availableNetworks]);

    return ( 
        <Input 
            value={connectionStatus}
            disabled
            style={{ color: 'inherit' }}
        />
     );
}
 
export default ConnectionStatus;
