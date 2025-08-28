import React, { useEffect, useState } from "react";
import Text from "@components/Text";
import useSystemServerPorts from "@hooks/useSystemServerPorts";

const ServerPortDisplay = () => {
    const { generalServerPort } = useSystemServerPorts()
    const [url, setUrl] = useState("")

    useEffect(() => {
        if (!generalServerPort) return
        const url = window.location.host.split(":")[0] + ':' + generalServerPort
        setUrl(url)
    }, [generalServerPort])

    return (
        <Text
            text={url}
            style={{ width: "auto" }}
        />
    );
}

export default ServerPortDisplay;