import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import { SocketIOContext } from "@components/SocketIOProvider";
import { NetworkConfiguration, NetworkStatus } from "@common/types/network";
import { NetworkEvents } from "@common/events/network.events";
import { message } from "antd";
import { Logger } from "@helpers/logger";
import { NetworkCommands } from "@common/commands/net.commands";

// Función helper para crear una configuración de red por defecto
const createDefaultNetworkConfiguration = (): NetworkConfiguration => ({
    interfaceName: "LAN",
    status: NetworkStatus.UNKNOWN,
    dhcpEnabled: false,
    ipv4Address: "0.0.0.0/24",
    subnetMask: "255.255.255.0",
    gateway: "0.0.0.0",
    dnsServers: ["0.0.0.0", "0.0.0.0"]
});

interface NetworkInterfacesContextType {
    networkConfiguration: NetworkConfiguration;
    isLoading: boolean;
    updateNetworkConfiguration: (networkConfiguration: NetworkConfiguration) => Promise<void>;
}

const NetworkInterfacesContext = createContext<NetworkInterfacesContextType | undefined>(undefined);

export const NetworkInterfacesProvider = ({ children }: { children: ReactNode }) => {
    const { socket, emit } = useContext(SocketIOContext);
    const [networkConfiguration, setNetworkConfiguration] = useState<NetworkConfiguration>(createDefaultNetworkConfiguration());
    const [isLoading, setIsLoading] = useState<boolean>(true);

    const getNetworkStatus = useCallback(async (): Promise<NetworkConfiguration> => {
        setIsLoading(true);
        return new Promise((resolve, reject) => {
            if (!emit) {
                setIsLoading(false);
                const defaultConfig = createDefaultNetworkConfiguration();
                setNetworkConfiguration(defaultConfig);
                Logger.warn("Socket emit not available, using default configuration");
                resolve(defaultConfig);
                return;
            }
            emit(NetworkCommands.getNetworkStatus, null, (response: NetworkConfiguration | Error) => {
                setIsLoading(false);
                if (!(response instanceof Error) && response) {
                    setNetworkConfiguration(response);
                    resolve(response);
                } else {
                    console.error("Error getting network status:", response);
                    const defaultConfig = createDefaultNetworkConfiguration();
                    setNetworkConfiguration(defaultConfig);
                    Logger.warn("Failed to get network configuration, using default");
                    resolve(defaultConfig);
                }
            });
        });
    }, [emit]);

    const handleInterfacesChanged = useCallback((networkConfiguration: NetworkConfiguration) => {
        Logger.log("🌐 Network interfaces changed:", networkConfiguration);
        setNetworkConfiguration(networkConfiguration);
    }, []);

    const handleIntefaceDisconnection = useCallback((networkConfiguration: NetworkConfiguration) => {
        Logger.log("🌐 NetworkInterfacesContext - NETWORK_DISCONNECTED event received:", networkConfiguration);
        message.warning("La interfaz de red se ha desconectado.");
        setNetworkConfiguration(networkConfiguration);
    }, []);

    const handleInterfaceConnection = useCallback((networkConfiguration: NetworkConfiguration) => {
        Logger.log("🌐 NetworkInterfacesContext - NETWORK_CONNECTED event received:", networkConfiguration);
        message.success("La interfaz de red se ha conectado.");
        setNetworkConfiguration(networkConfiguration);
    }, []);

    const updateNetworkConfiguration = useCallback(async (networkConfiguration: NetworkConfiguration): Promise<void> => {
        message.info(`Intentando aplicar cambios. Si se encontraba conectado mediante esta interfaz podría quedar desconectado.`);

        return new Promise((resolve, reject) => {
            if (!emit) {
                Logger.error("Socket emit not available for network configuration update");
                message.error("Error: No se puede aplicar la configuración de red.");
                reject(new Error("Socket emit not available"));
                return;
            }

            // Aplicar la configuración de red
            emit(NetworkCommands.setNetworkConfiguration, networkConfiguration, async (...args: any[]) => {
                Logger.log("🌐 Callback received with args:", args);
                
                // Manejar ambos casos: callback(error, result) o callback(result)
                let error: string | null = null;
                let success: boolean = false;
                
                if (args.length === 1) {
                    // Caso: callback(result) - el backend solo envía un parámetro
                    const result = args[0];
                    if (result === null) {
                        // null significa éxito en este contexto
                        success = true;
                    } else if (typeof result === 'string') {
                        // string significa error
                        error = result;
                    } else if (typeof result === 'boolean') {
                        // boolean directo
                        success = result;
                    }
                } else if (args.length === 2) {
                    // Caso: callback(error, result) - patrón estándar Node.js
                    [error, success] = args;
                }
                
                Logger.log("🌐 Parsed error:", error, "success:", success);
                
                if (!error && success) {
                    message.success("Configuración de red aplicada exitosamente.");
                    Logger.log("🌐 Network configuration updated successfully");
                    
                    // Esperar un momento para que el sistema aplique los cambios
                    setTimeout(async () => {
                        try {
                            // Actualizar el estado local con la nueva configuración
                            await getNetworkStatus();
                            resolve();
                        } catch (error) {
                            Logger.error("Error refreshing network status after update:", error);
                            resolve(); // Resolver de todos modos para no bloquear la UI
                        }
                    }, 2000); // Esperar 2 segundos antes de actualizar el estado
                } else {
                    const errorMessage = error || "Error desconocido al aplicar la configuración de red";
                    Logger.error("Error updating network configuration:", errorMessage);
                    message.error(`Error al aplicar la configuración de red: ${errorMessage}`);
                    reject(new Error(errorMessage));
                }
            });
        });
    }, [emit, getNetworkStatus]);



    useEffect(() => {
        if (!socket) {
            Logger.log("🌐 NetworkInterfacesContext - Socket not available, skipping event subscription");
            return;
        }

        Logger.log("🌐 NetworkInterfacesContext - Subscribing to network events");

        // Escuchar eventos de cambios en las interfaces
        socket.on(NetworkEvents.NETWORK_DISCONNECTED, handleIntefaceDisconnection);
        socket.on(NetworkEvents.NETWORK_CONNECTED, handleInterfaceConnection);
        socket.on(NetworkEvents.NETWORK_UPDATED, handleInterfacesChanged);

        // Obtener el estado inicial de las interfaces de red
        getNetworkStatus()

        return () => {
            Logger.log("🌐 NetworkInterfacesContext - Unsubscribing from network events");
            socket.off(NetworkEvents.NETWORK_DISCONNECTED, handleIntefaceDisconnection);
            socket.off(NetworkEvents.NETWORK_CONNECTED, handleInterfaceConnection);
            socket.off(NetworkEvents.NETWORK_UPDATED, handleInterfacesChanged);
        };
    }, [socket, handleInterfacesChanged]);

    return (
        <NetworkInterfacesContext.Provider value={{ 
            networkConfiguration,
            isLoading,
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
