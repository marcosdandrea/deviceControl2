import React from "react";
import ToolbarButton from "../ToolbarButton";
import { MdTerminal } from "react-icons/md";

const OpenTerminalView = () => {

    const handleOnClick = () => {   
        window.open("/terminal", "terminalWindow", "width=800,height=500,location=no");
    }

    return ( 
    <ToolbarButton
        onClick={handleOnClick}
        icon={<MdTerminal size={20}/>}/>
   );
}

export default OpenTerminalView
