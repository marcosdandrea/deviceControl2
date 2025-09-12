import React from "react";
import ToolbarButton from "../ToolbarButton";
import { MdOutlineViewList } from "react-icons/md";

const OpenControlView = () => {

    const handleOnClick = () => {   
        window.open("/control", "controlWindow", "width=800,height=500,location=no");
    }

    return ( 
    <ToolbarButton
        onClick={handleOnClick}
        icon={<MdOutlineViewList size={20}/>}/>
   );
}

export default OpenControlView
