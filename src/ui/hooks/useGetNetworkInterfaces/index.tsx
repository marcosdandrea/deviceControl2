import systemCommands from "@common/commands/system.commands";
import { SocketIOContext } from "@components/SocketIOProvider";
import { useContext, useEffect, useState } from "react";

const useGetNetworkInterfaces = () => {
    const {emit} = useContext(SocketIOContext)
    const [networkInterfaces, setNetworkInterfaces] =  useState<string[]>([])

    const getNetworkInterfaces = () => {
        emit(systemCommands.getServerPorts, null, (response: {main: number, general: number}) => {
            // Para obtener las IPs del servidor, usamos la API del sistema
            // que retorna las IPs donde el servidor está escuchando
            // Por ahora, esto devuelve un array vacío hasta que se implemente correctamente
            setNetworkInterfaces([])
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