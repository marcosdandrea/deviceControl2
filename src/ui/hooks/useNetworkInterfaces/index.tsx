import "react";
import { useContext, useEffect, useState } from "react";
import { SocketIOContext } from "@components/SocketIOProvider";
import { NetworkDeviceSummary } from "@common/types/network";
import netCommands from "@common/commands/net.commands";

const useNetworkInterfaces = () => {
    const { socket, emit } = useContext(SocketIOContext)
    const [networkInterfaces, setNetworkInterfaces] = useState<NetworkDeviceSummary[]>([])

    const getNetworkInterfaces = () => {
        emit(netCommands.getNetworkInterfaces, null, (devices: NetworkDeviceSummary[] | { error: string }) => {
            if (Array.isArray(devices)) {
                setNetworkInterfaces(devices);
            } else {
                console.error("Error fetching network interfaces:", devices.error);
                setNetworkInterfaces([]);
            }
        });
    }

    useEffect(() => {
        if (!socket) return;
        getNetworkInterfaces();
    }, [socket]);

    return {
        networkInterfaces, 
        refreshNetworkInterfaces: getNetworkInterfaces
    };
}

export default useNetworkInterfaces;