import React from "react";
import style from "./style.module.css";
import { Color } from "@common/theme/colors";
import { useNetworkInterfaces } from "@contexts/NetworkInterfacesContext";
import { NetworkStatus } from "@common/types/network";

const ServerConnectionMonitor = () => {
    const { networkConfiguration } = useNetworkInterfaces()
    const [color, setColor] = React.useState(Color.red)
    
    React.useEffect(() => {
        if (!networkConfiguration) return;
        console.log ({networkConfiguration})
        if (networkConfiguration.status){
            console.log (networkConfiguration.status)
            setColor(
                networkConfiguration.status === NetworkStatus.CONNECTED
                    ? Color.green
                    : networkConfiguration.status === NetworkStatus.DISCONNECTED || networkConfiguration.status === NetworkStatus.UNKNOWN
                        ? Color.red
                        : Color.warning
            );
        }
    }, [networkConfiguration])


    return (
        <div
            className={style.serverConnectionMonitor}
            style={{
                backgroundColor: color
            }} />
    );
}

export default ServerConnectionMonitor;