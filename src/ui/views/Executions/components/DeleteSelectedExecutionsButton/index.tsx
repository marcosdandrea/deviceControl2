import React, { useContext } from "react";
import ToolbarButton from "@views/Builder/components/Toolbar/components/ToolbarButton";
import { MdDelete } from "react-icons/md";
import { executionContext } from "@views/Executions";
import { message, Popconfirm } from "antd";
import useExecutions from "@views/Executions/hooks/useExecutions";

const DeleteSelectedExecutionsButton = () => {

    const { selectedExecutions, selectedRoutineId, setSelectedExecutions } = useContext(executionContext);
    const { deleteExecutions } = useExecutions(selectedRoutineId, undefined, { fetchOnMount: false });

    const handleDeleteSelected = async () => {
        if (!selectedRoutineId || selectedExecutions.length === 0) {
            return;
        }

        try {
            await deleteExecutions(selectedExecutions);
            setSelectedExecutions([]);
            message.success("Ejecuciones seleccionadas eliminadas correctamente.");
        } catch (error) {
            console.error(error);
            message.error("No se pudieron eliminar las ejecuciones seleccionadas.");
        }
    };

    return (
        <Popconfirm
            title="Estás seguro que deseas eliminar las ejecuciones seleccionadas?"
            onConfirm={handleDeleteSelected}
            okText="Sí"
            cancelText="No">
            <ToolbarButton
                disabled={selectedExecutions.length === 0 || !selectedRoutineId}
                icon={<MdDelete size={18} />}
                onClick={() => {}}/>
        </Popconfirm>
    );
}
 
export default DeleteSelectedExecutionsButton;