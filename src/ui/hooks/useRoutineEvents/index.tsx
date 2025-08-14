import { SocketIOContext } from "@components/SocketIOProvider";
import { useContext, useEffect, useState } from "react";

const useRoutineEvents = (routineId: string, events: string[]) => {

    const {socket} = useContext(SocketIOContext);
    const [lastEvent, setLastEvent] = useState<{time: number, event: string, data: any} | null>(null);

    useEffect(()=>{
        if (!socket || !routineId || !events) return;

        const routineChannelBasename = `routine.${routineId}`;

        for (const event of events) {
            const eventName = `${routineChannelBasename}.${event}`;
            socket.on(eventName, (data) => {
                setLastEvent({
                    time: Date.now(),
                    event,
                    data
                });
            });
        }


        return () => {
            for (const event of events) {
                const eventName = `${routineChannelBasename}.${event}`;
                socket.off(eventName);
            }
        };

    },[events, routineId]);

    return lastEvent;
}
 
export default useRoutineEvents ;