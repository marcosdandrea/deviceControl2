import React from "react";
import ToolbarButton from "../ToolbarButton";
import { MdUpload } from "react-icons/md";
import useProject from "@hooks/useProject";

const UploadAndApplyButton = () => {

    const { loadProjectFile, unloadProject, project } = useProject();

    const handleOnUploadAndApply = async () => {
        console.log('Uploading and applying project');
        console.log (project);
        await unloadProject();
        loadProjectFile(JSON.stringify(project));
    }

    return (
        <ToolbarButton 
            icon={<MdUpload />} 
            disabled={!project}
            onClick={handleOnUploadAndApply} />
    );
}
 
export default UploadAndApplyButton;