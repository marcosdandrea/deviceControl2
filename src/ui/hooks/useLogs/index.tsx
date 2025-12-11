import logEvents from "@common/events/log.events";
import { SocketIOContext } from "@components/SocketIOProvider";
import { useContext, useEffect, useState, useCallback } from "react";

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

    const addToInfoLog = useCallback((message: string, data?: any) => {
        const newLog = { message, data };
        setLogs((prevLogs) => [...prevLogs, newLog]);
        setLastInfoLog(newLog);
    }, []);

    const addToWarningLog = useCallback((message: string, data?: any) => {
        const newLog = { message, data };
        setLogs((prevLogs) => [...prevLogs, newLog]);
        setLastWarningLog(newLog);
    }, []);

    const addToErrorLog = useCallback((message: string, data?: any) => {
        const newLog = { message, data };
        setLogs((prevLogs) => [...prevLogs, newLog]);
        setLastErrorLog(newLog);
    }, []);

    const clearLogs = useCallback(() => {
        setLogs([]);
        setLastInfoLog(null);
        setLastWarningLog(null);
        setLastErrorLog(null);
    }, []);

    useEffect(()=>{
        if (!socket) return;

        socket.on(logEvents.logInfo, addToInfoLog);
        socket.on(logEvents.logWarning, addToWarningLog);
        socket.on(logEvents.logError, addToErrorLog);

        return () => {
            socket.off(logEvents.logInfo, addToInfoLog);
            socket.off(logEvents.logWarning, addToWarningLog);
            socket.off(logEvents.logError, addToErrorLog);
        };
    }, [socket, addToInfoLog, addToWarningLog, addToErrorLog]);

    return { logs, clearLogs, lastInfoLog, lastWarningLog, lastErrorLog };
}
 
export default useLogs;