import { SocketIOContext } from "@components/SocketIOProvider";
import { useContext, useEffect, useState, useCallback, useMemo } from "react";

const useRoutineEvents = (routineId: string, events: string[]) => {

    const {socket} = useContext(SocketIOContext);
    const [lastEvent, setLastEvent] = useState<{time: number, event: string, data: any} | null>(null);

    const routineChannelBasename = useMemo(() => 
        routineId ? `routine.${routineId}` : null
    , [routineId]);

    const handleEvent = useCallback((event: string) => (data: any) => {
        setLastEvent({
            time: Date.now(),
            event,
            data
        });
    }, []);

    useEffect(()=>{
        if (!socket || !routineChannelBasename || !events?.length) return;

        const handlers = new Map();

        for (const event of events) {
            const eventName = `${routineChannelBasename}.${event}`;
            const handler = handleEvent(event);
            handlers.set(eventName, handler);
            socket.on(eventName, handler);
        }

        return () => {
            for (const [eventName, handler] of handlers) {
                socket.off(eventName, handler);
            }
            handlers.clear();
        };

    }, [socket, routineChannelBasename, events, handleEvent]);

    return lastEvent;
}
 
export default useRoutineEvents ;