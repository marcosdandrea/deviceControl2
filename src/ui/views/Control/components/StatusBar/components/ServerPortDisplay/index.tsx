import React, { useEffect, useState } from "react";
import Text from "@components/Text";
import useSystemServerPorts from "@hooks/useSystemServerPorts";
import useNetworkInterfaces from "@hooks/useNetworkInterfaces";
import { Logger } from "@helpers/logger";

const ServerPortDisplay = () => {
    const { networkInterfaces, isLoading } = useNetworkInterfaces()
    const { generalServerPort } = useSystemServerPorts()
    const [url, setUrl] = useState("Obteniendo IP...")

    useEffect(() => {
        // Si está cargando, mostrar "Obteniendo IP..."
        if (isLoading) {
            setUrl("Obteniendo IP...");
            return;
        }
        
        if (!networkInterfaces) {
            Logger.log("🌐 ServerPortDisplay - networkInterfaces is null/undefined");
            setUrl("Desconectado");
            return;
        }
        Logger.log ("🌐 ServerPortDisplay - networkInterfaces changed:", networkInterfaces);
        Logger.log ("🌐 ServerPortDisplay - networkInterfaces count:", networkInterfaces.length);
        
        networkInterfaces.forEach((iface, idx) => {
            Logger.log(`  Interface ${idx}: device=${iface.device}, type=${iface.type}, state=${iface.state}, ip=${iface.ipv4?.address || 'N/A'}`);
        });
        
        const connectedInterfaces = networkInterfaces.filter((iface) => 
            iface.state === "connected" && iface.ipv4?.address
        );
        
        Logger.log("🌐 ServerPortDisplay - Connected interfaces count:", connectedInterfaces.length);

        if (connectedInterfaces.length === 0) {
            Logger.log("🌐 ServerPortDisplay - No connected interfaces, setting 'Desconectado'");
            setUrl(`Desconectado`);
            return;
        }
        const connectedURL = connectedInterfaces.map((iface) => {
            return `${iface.ipv4.address.split("/")[0]}`
        })

        const finalUrl = `${connectedURL.join(", ")}`;
        Logger.log("🌐 ServerPortDisplay - Setting URL to:", finalUrl);
        setUrl(finalUrl)

    }, [networkInterfaces, isLoading, generalServerPort])

    return (
        <Text
            text={url}
            style={{ width: "auto" }}
        />
    );
}

export default ServerPortDisplay;