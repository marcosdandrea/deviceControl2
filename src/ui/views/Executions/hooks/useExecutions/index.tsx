import projectCommands from "@common/commands/project.commands";
import projectEvents from "@common/events/project.events";
import { SocketIOContext } from "@components/SocketIOProvider";
import { useCallback, useContext, useEffect, useState } from "react";

type UseExecutionsOptions = {
  fetchOnMount?: boolean;
};

const useExecutions = (
  routineId?: string | null,
  executionId?: string,
  options: UseExecutionsOptions = {}
) => {
  const { emit, socket } = useContext(SocketIOContext);
  const [executionList, setExecutionList] = useState([]);
  const [executionData, setExecutionData] = useState<any>(null);
  const { fetchOnMount = true } = options;
  const normalizedRoutineId = routineId || "";

  const getExecutionsList = useCallback(() => {
    if (!normalizedRoutineId) {
      setExecutionList([]);
      return;
    }
    emit(projectCommands.getExecutions, { routineId: normalizedRoutineId }, (payload) => {
      if (payload?.error) {
        console.error(payload.error);
        return;
      }
      setExecutionList(payload);
    });
  }, [emit, normalizedRoutineId]);

  const getExecution = useCallback(() => {
    if (!normalizedRoutineId || !executionId) {
      setExecutionData(null);
      return;
    }
    emit(
      projectCommands.getExecution,
      { routineId: normalizedRoutineId, executionId },
      (payload) => {
        if (payload?.error) {
          console.error(payload.error);
          return;
        }
        setExecutionData(payload);
      }
    );
  }, [emit, executionId, normalizedRoutineId]);

  useEffect(() => {
    if (!normalizedRoutineId) {
      setExecutionList([]);
      setExecutionData(null);
      return;
    }

    if (fetchOnMount) {
      getExecutionsList();
      if (executionId) {
        getExecution();
      } else {
        setExecutionData(null);
      }
    }
  }, [normalizedRoutineId, executionId, fetchOnMount, getExecutionsList, getExecution]);

  useEffect(() => {
    if (!socket) {
      return;
    }

    const handleExecutionsUpdated = (payload: { routineId?: string }) => {
      if (payload?.routineId === normalizedRoutineId) {
        getExecutionsList();
      }
    };

    socket.on(projectEvents.executionsUpdated, handleExecutionsUpdated);

    return () => {
      socket.off(projectEvents.executionsUpdated, handleExecutionsUpdated);
    };
  }, [socket, normalizedRoutineId, getExecutionsList]);

  const deleteExecution = (executionId: string) => {
    return new Promise((resolve, reject) => {
      if (!normalizedRoutineId) {
        reject("Routine ID is required to delete an execution.");
        return;
      }
      emit(projectCommands.deleteExecution, {routineId: normalizedRoutineId, executionId }, (payload) => {
        if (payload?.error) {
          reject(payload.error);
          return;
        }
        getExecutionsList();
        resolve(payload);
      });
    });
  };

  const deleteExecutions = (executionIds: string[]) => {
    return new Promise((resolve, reject) => {
      if (!normalizedRoutineId) {
        reject("Routine ID is required to delete executions.");
        return;
      }
      emit(projectCommands.deleteExecutions, { routineId: normalizedRoutineId, executionIds }, (payload) => {
        if (payload?.error) {
          reject(payload.error);
          return;
        }
        getExecutionsList();
        resolve(payload);
      });
    });
  };

  const deleteAllExecutions = () => {
    return new Promise((resolve, reject) => {
      if (!normalizedRoutineId) {
        reject("Routine ID is required to delete executions.");
        return;
      }
      emit(projectCommands.deleteAllExecutions, { routineId: normalizedRoutineId }, (payload) => {
        if (payload?.error) {
          reject(payload.error);
          return;
        }
        getExecutionsList();
        resolve(payload);
      });
    });
  };

  const downloadExecutions = (executionIds: string[]) => {
    return new Promise<{ data: string; fileName: string }>((resolve, reject) => {
      if (!normalizedRoutineId) {
        reject("Routine ID is required to download executions.");
        return;
      }
      emit(projectCommands.downloadExecutions, { routineId: normalizedRoutineId, executionIds }, (payload) => {
        if (payload?.error) {
          reject(payload.error);
          return;
        }
        resolve(payload);
      });
    });
  };

  return {
    executionList,
    executionData,
    deleteExecution,
    deleteExecutions,
    deleteAllExecutions,
    downloadExecutions,
    refreshExecutions: getExecutionsList,
  };
};

export default useExecutions;
