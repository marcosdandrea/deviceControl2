import systemCommands from "@common/commands/system.commands";
import { SocketIOContext } from "@components/SocketIOProvider";
import { useContext, useEffect, useState } from "react";

const useGetNetworkInterfaces = () => {
    const {emit} = useContext(SocketIOContext)
    const [networkInterfaces, setNetworkInterfaces] =  useState<string[]>([])

    const getNetworkInterfaces = () => {
        emit(systemCommands.getNetworkInterfaces, null, (response: {interfaces: string[]}) => {
            setNetworkInterfaces(response.interfaces)
        })
    }

    useEffect(()=>{
        getNetworkInterfaces()
    }, [])

    return {
        networkInterfaces,
        getNetworkInterfaces
    }
}
 
export default useGetNetworkInterfaces;