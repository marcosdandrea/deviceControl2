import React from "react";
import ToolbarButton from "@views/Builder/components/Toolbar/components/ToolbarButton";
import { MdMoreHoriz } from "react-icons/md";
import { useNavigate } from "react-router-dom";
import { routineContext } from "../../../..";

const RoutineQuickOptionsButton = () => {
    const {routineData} = React.useContext(routineContext)
    const navigate = useNavigate()

    const handleOnShowOptions = () => {
        const routineId = routineData?.id
        if (!routineId) return;
        navigate(`/builder/${routineId}`)
    }

    return ( 
        <ToolbarButton
            icon={<MdMoreHoriz/>}
            onClick={handleOnShowOptions}
        />
    );
}
 
export default RoutineQuickOptionsButton;