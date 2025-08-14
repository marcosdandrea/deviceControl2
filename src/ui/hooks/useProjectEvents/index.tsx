import { SocketIOContext } from "@components/SocketIOProvider";
import { useContext, useEffect, useState } from "react";

const useProjectEvents = (events: string[]) => {

    const {socket} = useContext(SocketIOContext);
    const [lastEvent, setLastEvent] = useState<{time: number, event: string, data: any} | null>(null);

    useEffect(()=>{
        if (!socket || !events) return;

        for (const event of events) {
            const eventName = `${event}`;
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
                const eventName = `${event}`;
                socket.off(eventName);
            }
        };

    },[events]);

    return lastEvent;
}
 
export default useProjectEvents ;