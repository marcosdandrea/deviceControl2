import appCommands from "@common/commands/app.commands";
import { TriggerType } from "@common/types/trigger.type";
import { SocketIOContext } from "@components/SocketIOProvider";
import { useContext, useEffect, useState } from "react";

const useGetAvailableTriggers = () => {
    const {emit} = useContext(SocketIOContext)
    const [availableTriggers, setAvailableTriggers] = useState<Record<string, TriggerType>>({});

    const getAvailableTriggers = () => {
        emit(appCommands.getTriggerTypes, null, (triggers: Record<string, TriggerType>) => {
            setAvailableTriggers(triggers);
        });
    }

    useEffect(() => {
        getAvailableTriggers();
    }, []);

    return { availableTriggers };
}
 
export default useGetAvailableTriggers;