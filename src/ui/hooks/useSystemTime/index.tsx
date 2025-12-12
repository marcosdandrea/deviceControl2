import systemCommands from "@common/commands/system.commands";
import { SocketIOContext } from "@components/SocketIOProvider";
import { useContext, useEffect, useRef, useState } from "react";
import { Logger } from "@helpers/logger";

const useSystemTime = ({format}) => {
    const clockRef = useRef<number | undefined>(undefined);
    const { emit } = useContext(SocketIOContext)
    const [time, setTime] = useState<string | undefined>(undefined);
    const [timeOffset, setTimeOffset] = useState<number | undefined>(undefined);

    useEffect(() => {
        emit(systemCommands.getSystemTime, null, (answer: {time: string, error?: string}) => {
            if (answer?.error || !answer?.time) {
                Logger.error(answer.error);
                return;
            }
            setTimeOffset(Date.now() - new Date(answer.time).getTime());
        });
    }, []);

    useEffect(() => {
        clockRef.current = setInterval(() => {
            if (timeOffset !== undefined) {
                const newTime = new Date(Date.now() - timeOffset);
                setTime(newTime.toLocaleTimeString(format));
            }
        }, 1000);

        return () => clearInterval(clockRef.current);
    }, [timeOffset]);

    return { time };
}

export default useSystemTime;