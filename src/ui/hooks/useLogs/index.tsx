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
    const [lastInfoLog, setLastInfoLog] = useState<logEntry>(null);
    const [lastErrorLog, setLastErrorLog] = useState<logEntry>(null);
    const [lastWarningLog, setLastWarningLog] = useState<logEntry>(null);

    const addToInfoLog = (message: string, data?: any) => {
        const newLog = { message, data };
        setLogs((prevLogs) => [...prevLogs, newLog]);
        setLastInfoLog(newLog);
    }

    const addToWarningLog = (message: string, data?: any) => {
        const newLog = { message, data };
        setLogs((prevLogs) => [...prevLogs, newLog]);
        setLastWarningLog(newLog);
    }

    const addToErrorLog = (message: string, data?: any) => {
        const newLog = { message, data };
        setLogs((prevLogs) => [...prevLogs, newLog]);
        setLastErrorLog(newLog);
    }

    const clearLogs = () => {
        setLogs([]);
        setLastInfoLog(null);
        setLastWarningLog(null);
        setLastErrorLog(null);
    };

    useEffect(()=>{
        socket.on(logEvents.logInfo, addToInfoLog);
        socket.on(logEvents.logWarning, addToWarningLog);
        socket.on(logEvents.logError, addToErrorLog);

        return () => {
            socket.off(logEvents.logInfo, addToInfoLog);
            socket.off(logEvents.logWarning, addToWarningLog);
            socket.off(logEvents.logError, addToErrorLog);
        };
    }, [socket]);

    return { logs, clearLogs, lastInfoLog, lastWarningLog, lastErrorLog };
}
 
export default useLogs;