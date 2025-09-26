import React, { useContext } from "react";
import ToolbarButton from "@views/Builder/components/Toolbar/components/ToolbarButton";
import { MdDelete, MdDeleteForever } from "react-icons/md";
import { executionContext } from "@views/Executions";
import { Popconfirm } from "antd";

const DeleteSelectedExecutionsButton = () => {

    const { selectedExecutions } = useContext(executionContext);

    const handleDeleteSelected = () => {
        // Logic to delete all executions
    };

    return (
        <Popconfirm
            title="Estás seguro que deseas eliminar las ejecuciones seleccionadas?"
            onConfirm={handleDeleteSelected}
            okText="Sí"
            cancelText="No">
            <ToolbarButton
                disabled={selectedExecutions.length === 0}
                icon={<MdDelete size={18} />}
                onClick={() => {}}/>
        </Popconfirm>
    );
}
 
export default DeleteSelectedExecutionsButton;