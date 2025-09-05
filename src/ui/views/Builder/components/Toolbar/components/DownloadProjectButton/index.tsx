import React from "react";
import ToolbarButton from "../ToolbarButton";
import { MdOutlineSaveAlt } from "react-icons/md";
import useProject from "@hooks/useProject";

const DownloadProjectButton = () => {

    const { getProjectFile, project } = useProject();

    const handleOnDownload = async () => {
        try {
            const projectContent = await getProjectFile();
            if (projectContent) {
                const blob = new Blob([projectContent], { type: "application/json" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `${project.name}.dc2`
                a.click();
                URL.revokeObjectURL(url);
            }
        } catch (error) {
            console.error("Error downloading project:", error);
        }
    }

    return (
        <ToolbarButton
            icon={<MdOutlineSaveAlt />}
            onClick={handleOnDownload} />
    );
}

export default DownloadProjectButton;