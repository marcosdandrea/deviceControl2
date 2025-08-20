import React, { useContext } from "react";
import style from "./style.module.css";
import { SocketIOContext } from "@components/SocketIOProvider";
import { Color } from "@common/theme/colors";

const ServerConnectionMonitor = () => {
    const { isConnected } = useContext(SocketIOContext)

    return (
        <div
            className={style.serverConnectionMonitor}
            style={{
                backgroundColor: isConnected 
                    ? Color.green 
                    : Color.red
            }} />
    );
}

export default ServerConnectionMonitor;