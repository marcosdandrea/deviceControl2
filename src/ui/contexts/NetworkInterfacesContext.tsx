import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import { SocketIOContext } from "@components/SocketIOProvider";
import { NetworkDeviceSummary } from "@common/types/network";
import netCommands from "@common/commands/net.commands";
import networkEvents from "@common/events/network.events";
import { message } from "antd";
import { Logger } from "@helpers/logger";

interface NetworkInterfacesContextType {
    networkInterfaces: NetworkDeviceSummary[];
    isLoading: boolean;
    refreshNetworkInterfaces: () => void;
    applyChanges: (interfaceName: string, settings: InterfaceSettings) => void;
}

interface InterfaceSettings {
    dhcp: boolean;
    ipv4: string;
    gateway: string;
    dns: string[];
}

const NetworkInterfacesContext = createContext<NetworkInterfacesContextType | undefined>(undefined);

export const NetworkInterfacesProvider = ({ children }: { children: ReactNode }) => {
    const { socket, emit } = useContext(SocketIOContext);
    const [networkInterfaces, setNetworkInterfaces] = useState<NetworkDeviceSummary[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);

    const getNetworkInterfaces = useCallback(() => {
        if (!emit) return;
        
        setIsLoading(true);
        emit(netCommands.getNetworkInterfaces, null, (devices: NetworkDeviceSummary[] | { error: string }) => {
            if (Array.isArray(devices)) {
                setNetworkInterfaces(devices);
            } else {
                Logger.error("Error fetching network interfaces:", devices.error);
                message.error(`Error fetching network interfaces: ${devices.error}`);
                setNetworkInterfaces([]);
            }
            setIsLoading(false);
        });
    }, [emit]);

    const handleInterfacesChanged = useCallback((interfaces: NetworkDeviceSummary[]) => {
        Logger.log("🌐 Network interfaces changed:", interfaces);
        setNetworkInterfaces(interfaces);
        setIsLoading(false);
    }, []);

    const applyChanges = useCallback((interfaceName: string, settings: InterfaceSettings) => {
        if (!emit) return;

        message.info(`Intentando aplicar cambios. Si se encontraba conectado mediante esta interfaz podría quedar desconectado.`);
        emit(netCommands.applyInterfaceSettings, { interfaceName, settings }, (response: { success: boolean; error?: string }) => {
            if (!response.success) {
                message.error(`Se ha producido un error intentando aplicar la configuración. ${response.error}`);
            } else {
                message.success(`Los cambios fueron aplicados correctamente`);
                // Refrescar la lista de interfaces después de aplicar cambios
                // Esperar más tiempo para DHCP ya que puede tardar en obtener la dirección
                const delay = settings.dhcp ? 3000 : 1500;
                setTimeout(() => {
                    getNetworkInterfaces();
                }, delay);
            }
        });
    }, [emit, getNetworkInterfaces]);

    useEffect(() => {
        if (!socket) return;

        // Escuchar eventos de cambios en las interfaces
        socket.on(networkEvents.networkInterfacesChanged, handleInterfacesChanged);

        // Obtener el estado inicial
        getNetworkInterfaces();

        return () => {
            socket.off(networkEvents.networkInterfacesChanged, handleInterfacesChanged);
        };
    }, [socket, handleInterfacesChanged, getNetworkInterfaces]);

    return (
        <NetworkInterfacesContext.Provider value={{ 
            networkInterfaces,
            isLoading, 
            refreshNetworkInterfaces: getNetworkInterfaces,
            applyChanges 
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
