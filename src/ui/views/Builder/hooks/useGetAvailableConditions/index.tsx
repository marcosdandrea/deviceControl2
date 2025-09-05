import appCommands from "@common/commands/app.commands";
import { SocketIOContext } from "@components/SocketIOProvider";
import { useContext, useEffect, useState } from "react";

const useGetAvailableConditions = () => {
    const {emit} = useContext(SocketIOContext)
    const [availableConditions, setAvailableConditions] = useState<string[]>([]);

    const getAvailableConditions = () => {
        emit(appCommands.getConditionTypes, null, (conditions: string[]) => {
            setAvailableConditions(conditions);
        });
    }

    useEffect(() => {
        getAvailableConditions();
    }, []);

    return { availableConditions };
}
 
export default useGetAvailableConditions;