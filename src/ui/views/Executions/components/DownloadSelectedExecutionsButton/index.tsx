import React, { useContext } from "react";
import ToolbarButton from "@views/Builder/components/Toolbar/components/ToolbarButton";
import { MdDownload } from "react-icons/md";
import { executionContext } from "@views/Executions";

const DownloadSelectedExecutionButtons = () => {

    const { selectedExecutions } = useContext(executionContext);

    const handleDownloadSelected = () => {
        // Logic to delete all executions
    };

    return (
        <ToolbarButton
            disabled={selectedExecutions.length === 0}
            icon={<MdDownload size={18} />}
            onClick={handleDownloadSelected}
        />
    );
}
 
export default DownloadSelectedExecutionButtons;