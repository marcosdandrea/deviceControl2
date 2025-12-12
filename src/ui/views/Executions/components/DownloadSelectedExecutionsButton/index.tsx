import React, { useContext } from "react";
import ToolbarButton from "@views/Builder/components/Toolbar/components/ToolbarButton";
import { MdDownload } from "react-icons/md";
import { executionContext } from "@views/Executions";
import useExecutions from "@views/Executions/hooks/useExecutions";
import { message } from "antd";
import { Logger } from "@helpers/logger";

const DownloadSelectedExecutionButtons = () => {

    const { selectedExecutions, selectedRoutineId } = useContext(executionContext);
    const { downloadExecutions } = useExecutions(selectedRoutineId, undefined, { fetchOnMount: false });

    const handleDownloadSelected = async () => {
        if (!selectedRoutineId || selectedExecutions.length === 0) {
            return;
        }

        try {
            const { data, fileName } = await downloadExecutions(selectedExecutions);

            const byteCharacters = atob(data);
            const byteNumbers = new Array(byteCharacters.length);
            for (let i = 0; i < byteCharacters.length; i++) {
                byteNumbers[i] = byteCharacters.charCodeAt(i);
            }
            const byteArray = new Uint8Array(byteNumbers);
            const blob = new Blob([byteArray], { type: "application/zip" });
            const url = URL.createObjectURL(blob);

            const link = document.createElement("a");
            link.href = url;
            link.download = fileName || `${selectedRoutineId}-executions.zip`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

            message.success("Descarga completada correctamente.");
        } catch (error) {
            Logger.error(error);
            message.error("No se pudieron descargar las ejecuciones seleccionadas.");
        }
    };

    return (
        <ToolbarButton
            disabled={selectedExecutions.length === 0 || !selectedRoutineId}
            icon={<MdDownload size={18} />}
            onClick={handleDownloadSelected}
        />
    );
}
 
export default DownloadSelectedExecutionButtons;