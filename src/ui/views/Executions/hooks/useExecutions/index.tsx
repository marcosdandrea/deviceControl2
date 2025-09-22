import projectCommands from "@common/commands/project.commands";
import { SocketIOContext } from "@components/SocketIOProvider";
import { useContext, useEffect, useState } from "react";

const useExecutions = (routineId: string, executionId?: string) => {
  const { emit } = useContext(SocketIOContext);
  const [executionList, setExecutionList] = useState([]);
  const [executionData, setExecutionData] = useState([]);

  const getExecutionsList = () => {
    emit(projectCommands.getExecutions, { routineId }, (payload) => {
      if (payload?.error) {
        console.error(payload.error);
        return;
      }
      setExecutionList(payload);
    });
  };

  const getExecution = () => {
      emit(projectCommands.getExecution, { routineId, executionId }, (payload) => {
        if (payload?.error) {
          console.error(payload.error);
          return;
        }
        setExecutionData(payload);
      });
  };

  useEffect(() => {
    if (routineId) {
      getExecutionsList();
      if (executionId) {
        getExecution();
      }else {
        setExecutionData(null);
      }
    }
  }, [routineId, executionId]);

  const deleteExecution = (executionId: string) => {
    return new Promise((resolve, reject) => {
      emit(projectCommands.deleteExecution, {routineId, executionId }, (payload) => {
        if (payload?.error) {
          reject(payload.error);
          return;
        }
        getExecutionsList();
        resolve(payload);
      });
    });
  };

  return {
    executionList,
    executionData,
    deleteExecution,
  };
};

export default useExecutions;
