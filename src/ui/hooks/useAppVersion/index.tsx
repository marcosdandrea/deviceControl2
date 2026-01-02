import systemCommands from "@common/commands/system.commands";
import { SocketIOContext } from "@components/SocketIOProvider";
import React, {  useContext, useEffect } from "react";

const useAppVersion = () => {
    const {socket} = useContext(SocketIOContext)
    const [version, setVersion] = React.useState<string>("");

    useEffect(() => {
        socket.emit(systemCommands.getAppVersion, null, ({version}:{version: string}) => {   
            setVersion(version)
        })

    }, [socket]);

    return  {version} ;
}
 
export default useAppVersion;