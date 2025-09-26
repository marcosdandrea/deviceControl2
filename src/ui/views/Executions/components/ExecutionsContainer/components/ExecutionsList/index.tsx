import React, { useContext, useEffect, useState } from "react";
import style from "./style.module.css";
import { Input, List, message, Popconfirm } from "antd";
import { executionContext } from "@views/Executions";
import useExecutions from "@views/Executions/hooks/useExecutions";
import Text from "@components/Text";

const ExecutionListItem = (data: {
  timestamp: any;
  executionId: any;
  onClick: Function;
  onDelete: Function;
  onCheckboxChange?: Function;
  checked?: boolean;
}) => {
  const label = new Date(data.timestamp).toLocaleString();

  const handleOnDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (data.onDelete) {
      data.onDelete(data.executionId);
    }
  }

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (data.onCheckboxChange) {
      data.onCheckboxChange(data.executionId, e.target.checked);
    }
  };

  return (
    <div
      className={style.executionListItem}
      onClick={() => data.onClick(data.executionId)}>
        <div className={style.check} >
          <Input type="checkbox" onChange={handleCheckboxChange} checked={data.checked} />
        </div>
        <div className={style.executionTimestamp}>
          <Text color="white" size={14} fontFamily="Open Sans Bold">
            {label}</Text>
        </div>
      <div
        className={style.tag}
        style={{
          backgroundColor:
            data.origin === "trigger" ? "var(--trigger)" : "var(--routine)",
        }}>
        <Text
          style={{ textTransform: "uppercase" }}
          color="white"
          size={12}
          fontFamily="Open Sans Bold">
          {data.origin}
        </Text>
      </div>
    </div>
  );
};

const ExecutionsList = () => {
  const { selectedRoutineId, setSelectedExecutionId, setSelectedExecutions, selectedExecutions } = useContext(executionContext);
  const { executionList, deleteExecution } = useExecutions(selectedRoutineId);
  const [executionsData, setExecutionsData] = useState(executionList);

  console.log("Selected Executions: ", selectedExecutions);

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

  const handleOnCheckboxChange = (executionId: string, checked: boolean) => {
    setSelectedExecutions((prev) => {
      if (checked) {
        return [...prev, executionId];
      } else {
        return prev.filter((id) => id !== executionId);
      }
    });
  };

  return (
    <div className={style.executionsList}>
      <List
        dataSource={executionsData}
        renderItem={(item) => (
          <ExecutionListItem
            {...item}
            onDelete={handleDeleteExecution}
            onCheckboxChange={handleOnCheckboxChange}
            checked={selectedExecutions.includes(item.executionId)}
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
