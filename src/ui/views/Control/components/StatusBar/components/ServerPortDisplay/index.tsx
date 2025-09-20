import React, { useEffect, useState } from "react";
import Text from "@components/Text";
import useSystemServerPorts from "@hooks/useSystemServerPorts";
import useGetNetworkInterfaces from "@hooks/useGetNetworkInterfaces";

const ServerPortDisplay = () => {
    const {networkInterfaces} = useGetNetworkInterfaces()
    const {generalServerPort} = useSystemServerPorts()
    const [url, setUrl] = useState("")

    useEffect(() => {
        if (!networkInterfaces) return
        const url = networkInterfaces[0] 
        setUrl(`http://${url}:${generalServerPort}`)
    }, [networkInterfaces, generalServerPort])

    return (
        <Text
            text={url}
            style={{ width: "auto" }}
        />
    );
}

export default ServerPortDisplay;