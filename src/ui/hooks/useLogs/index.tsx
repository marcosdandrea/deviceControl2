import logEvents from "@common/events/log.events";
import { SocketIOContext } from "@components/SocketIOProvider";
import { useContext, useEffect, useState } from "react";

type logEntry = {
    message: string;
    data?: any;
}

const useLogs = () => {
    const {socket} = useContext(SocketIOContext)
    const [logs, setLogs] = useState<Array<logEntry>>([]);
    const [lastLog, setLastLog] = useState<logEntry>(null);

    const addToLog = (message: string, data?: any) => {
        const newLog = { message, data };
        setLogs((prevLogs) => [...prevLogs, newLog]);
        setLastLog(newLog);
    };

    const clearLogs = () => {
        setLogs([]);
        setLastLog(null);
    };

    useEffect(()=>{
        socket.on(logEvents.logInfo, addToLog);
        socket.on(logEvents.logWarning, addToLog);
        socket.on(logEvents.logError, addToLog);

        return () => {
            socket.off(logEvents.logInfo, addToLog);
            socket.off(logEvents.logWarning, addToLog);
            socket.off(logEvents.logError, addToLog);
        };
    }, [socket]);

    return { logs, clearLogs, lastLog };
}
 
export default useLogs;