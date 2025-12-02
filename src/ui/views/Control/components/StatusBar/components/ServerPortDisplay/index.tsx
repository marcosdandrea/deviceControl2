import React, { useEffect, useState } from "react";
import Text from "@components/Text";
import useSystemServerPorts from "@hooks/useSystemServerPorts";
import useNetworkInterfaces from "@hooks/useNetworkInterfaces";

const ServerPortDisplay = () => {
    const { networkInterfaces } = useNetworkInterfaces()
    const { generalServerPort } = useSystemServerPorts()
    const [url, setUrl] = useState("Disconnected")

    useEffect(() => {
        if (!networkInterfaces) return
        console.log ("🌐 ServerPortDisplay - networkInterfaces changed:", networkInterfaces);
        const connectedInterfaces = networkInterfaces.filter((iface) => iface.state == "connected");

        if (connectedInterfaces.length === 0) {
            setUrl(`Disconnected`);
            return;
        }
        const connectedURL = connectedInterfaces.map((iface) => {
            return `${iface.ipv4.address.split("/")[0]}`
        })

        setUrl(`${connectedURL.join(", ")}`)

    }, [networkInterfaces, generalServerPort])

    return (
        <Text
            text={url}
            style={{ width: "auto" }}
        />
    );
}

export default ServerPortDisplay;