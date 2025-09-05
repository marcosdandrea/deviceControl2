import appCommands from "@common/commands/app.commands";
import { SocketIOContext } from "@components/SocketIOProvider";
import { useContext, useEffect, useState } from "react";

const useGetAvailableTriggers = () => {
    const {emit} = useContext(SocketIOContext)
    const [availableTriggers, setAvailableTriggers] = useState<string[]>([]);

    const getAvailableTriggers = () => {
        emit(appCommands.getTriggerTypes, null, (triggers: string[]) => {
            setAvailableTriggers(triggers);
        });
    }

    useEffect(() => {
        getAvailableTriggers();
    }, []);

    return { availableTriggers };
}
 
export default useGetAvailableTriggers;