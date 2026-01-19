import React, { useEffect, useState } from "react";
import Text from "@components/Text";
import useSystemServerPorts from "@hooks/useSystemServerPorts";
import useNetworkInterfaces from "@hooks/useNetworkInterfaces";
import { Logger } from "@helpers/logger";
import { NetworkStatus } from "@common/types/network";

const ServerPortDisplay = () => {
    const { networkConfiguration, isLoading } = useNetworkInterfaces()
    const { generalServerPort } = useSystemServerPorts()
    const [url, setUrl] = useState("Obteniendo IP...")

    // Agregar logging para verificar cuando cambia el networkConfiguration
    useEffect(() => {
        Logger.log("🌐 ServerPortDisplay - Received networkConfiguration update:", {
            networkConfiguration,
            isLoading,
            hasStatus: networkConfiguration?.status ? true : false,
            status: networkConfiguration?.status
        });
    }, [networkConfiguration, isLoading]);

    useEffect(() => {
        // Si está cargando, mostrar "conectando..."
        if (isLoading) {
            setUrl("conectando...");
            return;
        }
        
        // Si no hay configuración de red o no tiene status
        if (!networkConfiguration || !networkConfiguration.status) {
            Logger.log("🌐 ServerPortDisplay - networkConfiguration is null/undefined or has no status");
            setUrl("Desconectado");
            return;
        }
        
        Logger.log ("🌐 ServerPortDisplay - networkConfiguration changed:", networkConfiguration);

        if (networkConfiguration.status === NetworkStatus.CONNECTED){
            Logger.log("🌐 ServerPortDisplay - Network is CONNECTED");
            const displayUrl = networkConfiguration.ipv4Address || "IP no disponible";
            setUrl(displayUrl);
        } else if (networkConfiguration.status === NetworkStatus.DISCONNECTED || networkConfiguration.status === NetworkStatus.UNKNOWN){
            Logger.log("🌐 ServerPortDisplay - Network is DISCONNECTED");
            setUrl("Desconectado");
            return;
        }

    }, [networkConfiguration, isLoading, generalServerPort])

    return (
        <Text
            text={url}
            style={{ width: "auto", color: "var(--text-dark)" }}
        />
    );
}

export default ServerPortDisplay;