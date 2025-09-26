import React, { useContext } from "react";
import ToolbarButton from "@views/Builder/components/Toolbar/components/ToolbarButton";
import { MdDeleteForever } from "react-icons/md";
import { executionContext } from "@views/Executions";
import { Popconfirm } from "antd";

const DeleteAllExecutionsButton = () => {

    const {selectedRoutineId} = useContext(executionContext);

    const handleDeleteAll = () => {
        // Logic to delete all executions
    };

    return (
        <Popconfirm
            title="Estás seguro que deseas eliminar todas las ejecuciones de esta rutina?"
            onConfirm={handleDeleteAll}
            okText="Sí"
            cancelText="No">
            <ToolbarButton
                onClick={() => {}}
                disabled={selectedRoutineId === null}
                icon={<MdDeleteForever size={18} />}
            />
        </Popconfirm>
    );
}
 
export default DeleteAllExecutionsButton;