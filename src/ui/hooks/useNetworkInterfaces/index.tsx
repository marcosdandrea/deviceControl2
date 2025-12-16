import "react";
import { useContext, useEffect, useState, useCallback } from "react";
import { SocketIOContext } from "@components/SocketIOProvider";
import { NetworkDeviceSummary } from "@common/types/network";
import netCommands from "@common/commands/net.commands";
import networkEvents from "@common/events/network.events";
import { message } from "antd";
import { Logger } from "@helpers/logger";

const useNetworkInterfaces = () => {
    const { socket, emit } = useContext(SocketIOContext)
    const [networkInterfaces, setNetworkInterfaces] = useState<NetworkDeviceSummary[]>([])

    const getNetworkInterfaces = () => {
        emit(netCommands.getNetworkInterfaces, null, (devices: NetworkDeviceSummary[] | { error: string }) => {
            if (Array.isArray(devices)) {
                setNetworkInterfaces(devices);
            } else {
                Logger.error("Error fetching network interfaces:", devices.error);
                message.error(`Error fetching network interfaces: ${devices.error}`);
                setNetworkInterfaces([]);
            }
        });
    }

    const handleInterfacesChanged = useCallback((interfaces: NetworkDeviceSummary[]) => {
        Logger.log("🌐 Network interfaces changed:", interfaces);
        setNetworkInterfaces(interfaces);
    }, []);

    type interfaceSettings = {
        dhcp: boolean;
        ipv4: string;
        gateway: string;
        dns: string[];
    }

    const applyChanges = (interfaceName: String, settings: interfaceSettings) => {
        message.info(`Intentando aplicar cambios. Si se encontraba conectado mediante esta interfaz podría quedar desconectado.`)
        emit(netCommands.applyInterfaceSettings, { interfaceName, settings }, (response: { success: boolean; error?: string }) => {
            if (!response.success) {
                message.error(`Se ha producido un error intentando aplicar la configuración. ${response.error}`)
            } else {
                message.success(`Los cambios fueron aplicados correctamente`)
                // Refrescar la lista de interfaces después de aplicar cambios
                // Esperar más tiempo para DHCP ya que puede tardar en obtener la dirección
                const delay = settings.dhcp ? 3000 : 1500;
                setTimeout(() => {
                    getNetworkInterfaces();
                }, delay);
            }
        });
    }

    useEffect(() => {
        if (!socket) return;

        // Iniciar monitoreo de interfaces de red
        socket.emit(netCommands.startNetworkMonitoring);

        // Escuchar eventos de cambios en las interfaces
        socket.on(networkEvents.networkInterfacesChanged, handleInterfacesChanged);

        // Obtener el estado inicial
        getNetworkInterfaces();

        return () => {
            socket.off(networkEvents.networkInterfacesChanged, handleInterfacesChanged);
            socket.emit(netCommands.stopNetworkMonitoring);
        };
    }, [socket, handleInterfacesChanged]);

    return {
        networkInterfaces, 
        refreshNetworkInterfaces: getNetworkInterfaces,
        applyChanges
    };
}

export default useNetworkInterfaces;