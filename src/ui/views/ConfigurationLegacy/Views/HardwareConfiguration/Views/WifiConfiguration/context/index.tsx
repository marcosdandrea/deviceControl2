import { WiFiNetwork } from "@common/types/wifi.types";
import useWifi from "@hooks/useWifi";
import React, { useEffect } from "react";

export const WifiContext = React.createContext({});

export type ConnectionStatus = "Desconectado" | "Conectando" | "Conectado" | "Contraseña Incorrecta";

export type ConnectionState = {
    status: "idle" | "connecting" | "connected" | "error" | "fallback";
    ssid?: string;
    message?: string;
    previousSSID?: string;
};

export type wifiContextType = {
    ssid: {
        value: WiFiNetwork | null,
        set: React.Dispatch<React.SetStateAction<WiFiNetwork | null>>
    },
    password: {
        value: string,
        set: React.Dispatch<React.SetStateAction<string>>
    },
    wifiStatus: import("@common/types/wifi.types").WiFiConnectionStatus,
    availableNetworks: import("@common/types/wifi.types").WiFiNetwork[],
    disconnectWifi: () => void,
    connectToWifi: () => void,
    connectionState: ConnectionState;
};

const WifiContextProvider = ({children}) => {
    const {wifiStatus, availableNetworks, disconnectWifi, connectWifi} = useWifi()
    const [ssid, setSsid] = React.useState<WiFiNetwork | null>(null);
    const [password, setPassword] = React.useState("");
    const [connectionState, setConnectionState] = React.useState<ConnectionState>({ status: "idle" });
    const [hasInitializedSSID, setHasInitializedSSID] = React.useState(false);

    // Seleccionar automáticamente la red activa la primera vez que se cargan las redes
    useEffect(() => {
        if (!hasInitializedSSID && availableNetworks.length > 0) {
            const activeNetwork = availableNetworks.find(network => network.inUse);
            if (activeNetwork) {
                setSsid(activeNetwork);
                setHasInitializedSSID(true);
            }
        }
    }, [availableNetworks, hasInitializedSSID]);

    // Actualizar el ssid si la red seleccionada cambia en la lista (mantener sincronizado)
    useEffect(() => {
        if (hasInitializedSSID && ssid) {
            const currentSSID = availableNetworks.find(network => network.ssid === ssid.ssid);
            if (currentSSID && currentSSID !== ssid) {
                setSsid(currentSSID);
            }
        }
    }, [availableNetworks, ssid, hasInitializedSSID]);

    // Monitorear cambios en wifiStatus para actualizar el estado de conexión
    useEffect(() => {
        if (connectionState.status === "connecting" && wifiStatus.connected && wifiStatus.ssid === connectionState.ssid) {
            setConnectionState({ status: "connected", ssid: wifiStatus.ssid });
        }
    }, [wifiStatus, connectionState]);

    const connectToWifi = () => {
        if (ssid) {
            setConnectionState({ status: "connecting", ssid: ssid.ssid });
            
            connectWifi(ssid.ssid, password, (result: any) => {
                if (result.success) {
                    setConnectionState({ status: "connected", ssid: ssid.ssid });
                } else if (result.fallbackApplied) {
                    setConnectionState({ 
                        status: "fallback", 
                        ssid: ssid.ssid,
                        message: result.message,
                        previousSSID: result.previousSSID
                    });
                } else {
                    setConnectionState({ 
                        status: "error", 
                        ssid: ssid.ssid,
                        message: result.message
                    });
                }
            });
        }
    }

    const handleOnSetSSID = (network: WiFiNetwork | null) => {
        setSsid(network);
        setPassword("");
    }

    const value = {
        ssid: {
            value: ssid,
            set: handleOnSetSSID
        },
        password: {
            value: password,
            set: setPassword
        },    
        wifiStatus, 
        availableNetworks,
        disconnectWifi,
        connectToWifi,
        connectionState
    } as wifiContextType;

    return ( 
    <WifiContext.Provider value={value}>
        {children}
    </WifiContext.Provider> );
}
 
export default WifiContextProvider;
