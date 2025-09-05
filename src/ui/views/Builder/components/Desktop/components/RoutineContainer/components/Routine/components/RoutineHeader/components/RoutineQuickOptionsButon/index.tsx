import React from "react";
import ToolbarButton from "@views/Builder/components/Toolbar/components/ToolbarButton";
import { MdMoreHoriz } from "react-icons/md";

const RoutineQuickOptionsButton = () => {

    const handleOnShowOptions = () => {}
    return ( 
        <ToolbarButton
            icon={<MdMoreHoriz/>}
            onClick={handleOnShowOptions}
        />
    );
}
 
export default RoutineQuickOptionsButton;