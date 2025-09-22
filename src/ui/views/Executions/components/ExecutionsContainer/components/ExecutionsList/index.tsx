import React, { useContext, useEffect, useState } from "react";
import style from "./style.module.css";
import { List, message, Popconfirm } from "antd";
import { executionContext } from "@views/Executions";
import useExecutions from "@views/Executions/hooks/useExecutions";
import Text from "@components/Text";
import { MdDelete } from "react-icons/md";

const ExecutionListItem = (data: {
  timestamp: any;
  executionId: any;
  onClick: Function;
  onDelete: Function;
}) => {
  const label = new Date(data.timestamp).toLocaleString();

  const handleOnDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (data.onDelete) {
      data.onDelete(data.executionId);
    }
  }

  return (
    <div
      className={style.executionListItem}
      onClick={() => data.onClick(data.executionId)}>
      <div
        className={style.tag}
        style={{
          backgroundColor:
            data.origin === "trigger" ? "var(--trigger)" : "var(--routine)",
        }}>
        <Text color="white" size={12} fontFamily="Open Sans Bold">
          {data.origin}
        </Text>
      </div>
      <div className={style.executionTimestamp}>
        <Text color="white" size={14} fontFamily="Open Sans Bold">
          {label}</Text>
      </div>
      <Popconfirm
        title="Estás seguro que deseas eliminar este registro?"
        onConfirm={handleOnDelete}
        okText="Sí"
        cancelText="No">
        <div
          className={style.deleteButton}
          title="Delete Execution">
          <MdDelete size={18} color="var(--error)" />
        </div>
      </Popconfirm>
    </div>
  );
};

const ExecutionsList = () => {
  const { selectedRoutineId, setSelectedExecutionId } =
    useContext(executionContext);
  const { executionList, deleteExecution } = useExecutions(selectedRoutineId);
  const [executionsData, setExecutionsData] = useState(executionList);

  useEffect(() => {
    setExecutionsData(executionList);
    setSelectedExecutionId(null);
  }, [executionList]);

  const handleDeleteExecution = (executionId: string) => {
    if (deleteExecution) {
      deleteExecution(executionId)
        .then(() => {message.success("Registro eliminado")})
        .catch(() => {message.error("Error al eliminar el registro")});    
    }
  };

  return (
    <div className={style.executionsList}>
      <List
        dataSource={executionsData}
        renderItem={(item) => (
          <ExecutionListItem
            {...item}
            onDelete={handleDeleteExecution}
            onClick={(id: string) =>
              setSelectedExecutionId ? setSelectedExecutionId(id) : null
            }
          />
        )}
      />
    </div>
  );
};

export default ExecutionsList;
