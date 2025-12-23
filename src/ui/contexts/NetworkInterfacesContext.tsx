import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import { SocketIOContext } from "@components/SocketIOProvider";
import { NetworkConfiguration } from "@common/types/network";
import { NetworkEvents } from "@common/events/network.events";
import { message } from "antd";
import { Logger } from "@helpers/logger";
import { NetworkCommands } from "@common/commands/net.commands";

interface NetworkInterfacesContextType {
    networkConfiguration: NetworkConfiguration;
    updateNetworkConfiguration: (networkConfiguration: NetworkConfiguration) => Promise<void>;
}

const NetworkInterfacesContext = createContext<NetworkInterfacesContextType | undefined>(undefined);

export const NetworkInterfacesProvider = ({ children }: { children: ReactNode }) => {
    const { socket, emit } = useContext(SocketIOContext);
    const [networkConfiguration, setNetworkConfiguration] = useState<NetworkConfiguration>({} as NetworkConfiguration);

    const getNetworkStatus = useCallback(async (): Promise<NetworkConfiguration> => {
        return new Promise((resolve, reject) => {
            emit(NetworkCommands.getNetworkStatus, null, (response: NetworkConfiguration | Error) => {
                if (!(response instanceof Error)) {
                    setNetworkConfiguration(response);
                    resolve(response);
                } else {
                    reject(new Error("Failed to get network configuration"));
                }
            });
        });
    }, [emit]);

    const handleInterfacesChanged = useCallback((networkConfiguration: NetworkConfiguration) => {
        Logger.log("🌐 Network interfaces changed:", networkConfiguration);
        setNetworkConfiguration(networkConfiguration);
    }, []);

    const handleIntefaceDisconnection = useCallback((networkConfiguration: NetworkConfiguration) => {
        Logger.log("🌐 Network interface disconnected");
        message.warning("La interfaz de red se ha desconectado.");
        setNetworkConfiguration(networkConfiguration);
    }, []);

    const handleInterfaceConnection = useCallback((networkConfiguration: NetworkConfiguration) => {
        Logger.log("🌐 Network interface connected:", networkConfiguration);
        message.success("La interfaz de red se ha conectado.");
        setNetworkConfiguration(networkConfiguration);
    }, []);

    const updateNetworkConfiguration = useCallback(async (networkConfiguration: NetworkConfiguration): Promise<void> => {
        message.info(`Intentando aplicar cambios. Si se encontraba conectado mediante esta interfaz podría quedar desconectado.`);

        
    }, [emit]);



    useEffect(() => {
        if (!socket) return;

        // Escuchar eventos de cambios en las interfaces
        socket.on(NetworkEvents.NETWORK_DISCONNECTED, handleIntefaceDisconnection);
        socket.on(NetworkEvents.NETWORK_CONNECTED, handleInterfaceConnection);
        socket.on(NetworkEvents.NETWORK_UPDATED, handleInterfacesChanged);

        // Obtener el estado inicial de las interfaces de red
        getNetworkStatus()

        return () => {
            socket.off(NetworkEvents.NETWORK_DISCONNECTED, handleIntefaceDisconnection);
            socket.off(NetworkEvents.NETWORK_CONNECTED, handleInterfaceConnection);
            socket.off(NetworkEvents.NETWORK_UPDATED, handleInterfacesChanged);
        };
    }, [socket, handleInterfacesChanged]);

    return (
        <NetworkInterfacesContext.Provider value={{ 
            networkConfiguration,
            updateNetworkConfiguration 
        }}>
            {children}
        </NetworkInterfacesContext.Provider>
    );
};

export const useNetworkInterfaces = () => {
    const context = useContext(NetworkInterfacesContext);
    if (!context) {
        throw new Error("useNetworkInterfaces must be used within a NetworkInterfacesProvider");
    }
    return context;
};
