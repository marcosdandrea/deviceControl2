import React from "react";
import ToolbarButton from "../ToolbarButton";
import { FaGear } from "react-icons/fa6";

const OpenConfigButton = () => {

    return (
        <ToolbarButton
            disabled={true}
            icon={<FaGear size={15} />}
            onClick={() => { }} />
    );
}

export default OpenConfigButton;
