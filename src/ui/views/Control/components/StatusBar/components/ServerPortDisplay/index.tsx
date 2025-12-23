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

    useEffect(() => {
        // Si está cargando, mostrar "Obteniendo IP..."
        if (isLoading) {
            setUrl("conectando...");
            return;
        }
        
        if (!networkConfiguration) {
            Logger.log("🌐 ServerPortDisplay - networkInterfaces is null/undefined");
            setUrl("Desconectado");
            return;
        }
        Logger.log ("🌐 ServerPortDisplay - networkInterfaces changed:", networkConfiguration);

        if (networkConfiguration.status === NetworkStatus.CONNECTED){
            Logger.log("🌐 ServerPortDisplay - Network is CONNECTED");
            setUrl(networkConfiguration.ipv4Address)
        } else if (networkConfiguration.status === NetworkStatus.DISCONNECTED || networkConfiguration.status === NetworkStatus.UNKNOWN){
            Logger.log("🌐 ServerPortDisplay - Network is DISCONNECTED");
            setUrl("Desconectado")
            return
        }

    }, [networkConfiguration, isLoading, generalServerPort])

    return (
        <Text
            text={url}
            style={{ width: "auto" }}
        />
    );
}

export default ServerPortDisplay;