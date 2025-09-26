import React, { useContext } from "react";
import ToolbarButton from "@views/Builder/components/Toolbar/components/ToolbarButton";
import { MdDeleteForever } from "react-icons/md";
import { executionContext } from "@views/Executions";
import { message, Popconfirm } from "antd";
import useExecutions from "@views/Executions/hooks/useExecutions";

const DeleteAllExecutionsButton = () => {
  const { selectedRoutineId, setSelectedExecutions, triggerExecutionsRefresh } =
    useContext(executionContext);
  const { deleteAllExecutions } = useExecutions(selectedRoutineId, undefined, {
    fetchOnMount: false,
  });

  const handleDeleteAll = async () => {
    if (!selectedRoutineId) {
      return;
    }

    try {
      await deleteAllExecutions();
      setSelectedExecutions([]);
      triggerExecutionsRefresh();
      message.success("Todas las ejecuciones de la rutina fueron eliminadas.");
    } catch (error) {
      console.error(error);
      message.error("No se pudieron eliminar todas las ejecuciones de la rutina.");
    }
  };

  return (
    <Popconfirm
      title="Estás seguro que deseas eliminar todas las ejecuciones de esta rutina?"
      onConfirm={handleDeleteAll}
      okText="Sí"
      cancelText="No"
    >
      <ToolbarButton
        onClick={() => {}}
        disabled={selectedRoutineId === null}
        icon={<MdDeleteForever size={18} />}
      />
    </Popconfirm>
  );
};


export default DeleteAllExecutionsButton;