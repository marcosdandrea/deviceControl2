import React from "react";
import ToolbarButton from "../ToolbarButton";
import { FaTimeline } from "react-icons/fa6";

const ExecutionsTimelineButton = () => {

    const handleOnClick = () => {   
        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;
        const width = windowWidth * 0.8;
        const height = windowHeight * 0.8;
        const left = window.screenX + (window.outerWidth - width) / 2;
        const top = window.screenY + (window.outerHeight - height) / 2;
        window.open(
            "/executions",
            "Linea de Tiempo de Ejecuciones",
            `width=${width},height=${height},left=${left},top=${top},location=no`
        );
    }

    return ( 
    <ToolbarButton
        onClick={handleOnClick}
        icon={<FaTimeline style={{ rotate: '90deg' }} size={20}/>}/>
   );
}

export default ExecutionsTimelineButton
