import appCommands from "@common/commands/app.commands";
import { ConditionType } from "@common/types/condition.type";
import { SocketIOContext } from "@components/SocketIOProvider";
import { useContext, useEffect, useState } from "react";

const useGetAvailableConditions = () => {
    const {emit} = useContext(SocketIOContext)
    const [availableConditions, setAvailableConditions] = useState<ConditionType[]>([]);

    const getAvailableConditions = () => {
        emit(appCommands.getConditionTypes, null, (conditions: ConditionType[]) => {
            setAvailableConditions(conditions);
        });
    }

    useEffect(() => {
        getAvailableConditions();
    }, []);

    return { availableConditions };
}
 
export default useGetAvailableConditions;