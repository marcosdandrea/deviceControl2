import React from "react";
import ToolbarButton from "../ToolbarButton";
import { MdOutlineClose } from "react-icons/md";
import useProject from "@hooks/useProject";

const CloseProjectButton = () => {

    const { unloadProject } = useProject();

    const handleOnCloseProject = async () => {
        try {
            unloadProject();
        } catch (error) {
            console.error("Error closing project:", error);
        }
    }

    return (
        <ToolbarButton
            icon={<MdOutlineClose />}
            onClick={handleOnCloseProject} />
    );
}

export default CloseProjectButton;
