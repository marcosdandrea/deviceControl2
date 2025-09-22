import React, { useState } from "react";
import style from "./style.module.css";
import { createContext } from "react";
import RoutineSelector from "./components/RoutineSelector";
import ExecutionsContainer from "./components/ExecutionsContainer";
import { ConfigProvider, theme } from "antd";

type ExecutionContextType = {
  selectedExecutionId: string | null;
  setSelectedExecutionId: (id: string | null) => void;
  selectedRoutineId?: string | null;
  setSelectedRoutineId?: (id: string | null) => void;
};

export const executionContext = createContext<ExecutionContextType>({
  selectedExecutionId: null,
  setSelectedExecutionId: () => {},
});

const Executions = () => {
  const [selectedRoutineId, setSelectedRoutineId] = useState<string | null>(
    null
  );
  const [selectedExecutionId, setSelectedExecutionId] = useState<string | null>(
    null
  );

  return (
    <ConfigProvider
      theme={{
        algorithm: theme.darkAlgorithm,
      }}
    >
      <executionContext.Provider
        value={{
          selectedExecutionId,
          setSelectedExecutionId,
          selectedRoutineId,
          setSelectedRoutineId,
        }}
      >
        <div className={style.executionsView}>
          <RoutineSelector />
          <ExecutionsContainer />
        </div>
      </executionContext.Provider>
    </ConfigProvider>
  );
};

export default Executions;
