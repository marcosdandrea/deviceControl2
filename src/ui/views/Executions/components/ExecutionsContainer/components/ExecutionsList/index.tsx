import React, { useContext, useEffect, useState, useMemo, useCallback, useRef } from "react";
import style from "./style.module.css";
import { Input, List, message } from "antd";
import { executionContext } from "@views/Executions";
import useExecutions from "@views/Executions/hooks/useExecutions";
import Text from "@components/Text";

const ExecutionListItem = React.memo((data: {
  timestamp: any;
  executionId: any;
  onClick: Function;
  onDelete: Function;
  onCheckboxChange?: Function;
  checked?: boolean;
  origin: string;
}) => {
  const label = useMemo(() => 
    new Date(data.timestamp).toLocaleString()
  , [data.timestamp]);

  const handleOnDelete = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (data.onDelete) {
      data.onDelete(data.executionId);
    }
  }, [data.onDelete, data.executionId]);

  const handleCheckboxChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (data.onCheckboxChange) {
      data.onCheckboxChange(data.executionId, e.target.checked);
    }
  }, [data.onCheckboxChange, data.executionId]);

  const tagStyle = useMemo(() => ({
    backgroundColor: data.origin === "trigger" ? "var(--trigger)" : "var(--routine)",
  }), [data.origin]);

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
        style={tagStyle}>
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
});

ExecutionListItem.displayName = 'ExecutionListItem';

const ExecutionsList = () => {
  const {
    selectedRoutineId,
    setSelectedExecutionId,
    setSelectedExecutions,
    selectedExecutions,
    executionsRefreshToken,
  } = useContext(executionContext);
  const { executionList, deleteExecution, refreshExecutions } = useExecutions(
    selectedRoutineId
  );
  const [executionsData, setExecutionsData] = useState(executionList);
  const previousExecutionListRef = useRef<any[]>([]);

  useEffect(() => {
    setExecutionsData(executionList);
    setSelectedExecutionId(null);
    
    // Solo actualizar selectedExecutions si la lista de ejecuciones cambió
    if (previousExecutionListRef.current !== executionList) {
      const filteredSelection = selectedExecutions.filter((id) =>
        executionList.some((execution) => execution.executionId === id)
      );
      setSelectedExecutions(filteredSelection);
      previousExecutionListRef.current = executionList;
    }
  }, [executionList, setSelectedExecutionId, setSelectedExecutions]);

  useEffect(() => {
    if (executionsRefreshToken > 0) {
      refreshExecutions();
    }
  }, [executionsRefreshToken, refreshExecutions]);

  const handleDeleteExecution = useCallback((executionId: string) => {
    if (deleteExecution) {
      deleteExecution(executionId)
        .then(() => {message.success("Registro eliminado")})
        .catch(() => {message.error("Error al eliminar el registro")});    
    }
  }, [deleteExecution]);

  const handleOnCheckboxChange = useCallback((executionId: string, checked: boolean) => {
    setSelectedExecutions((prev) => {
      if (checked) {
        return [...prev, executionId];
      } else {
        return prev.filter((id) => id !== executionId);
      }
    });
  }, [setSelectedExecutions]);


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
