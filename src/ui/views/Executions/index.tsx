import React, { useState } from "react";
import style from "./style.module.css";
import { createContext } from "react";
import RoutineSelector from "./components/RoutineSelector";
import ExecutionsContainer from "./components/ExecutionsContainer";
import { ConfigProvider, theme } from "antd";
import Toolbar from "@views/Builder/components/Toolbar";
import DeleteAllExecutionsButton from "./components/DeleteAllExecutionsButton";
import DeleteSelectedExecutionsButton from "./components/DeleteSelectedExecutionsButton";
import DownloadSelectedExecutionButtons from "./components/DownloadSelectedExecutionsButton";
import Divider from "@views/Builder/components/Toolbar/components/Divider";

type ExecutionContextType = {
  selectedExecutionId: string | null;
  setSelectedExecutionId: (id: string | null) => void;
  selectedRoutineId?: string | null;
  setSelectedRoutineId?: (id: string | null) => void;
  selectedExecutions: string[];
  setSelectedExecutions: (ids: string[]) => void;
};

export const executionContext = createContext<ExecutionContextType>({
  selectedExecutionId: null,
  setSelectedExecutionId: () => {},
  selectedRoutineId: null,
  setSelectedRoutineId: () => {},
  selectedExecutions: [],
  setSelectedExecutions: () => {},

});

const Executions = () => {
  const [selectedRoutineId, setSelectedRoutineId] = useState<string | null>(null);
  const [selectedExecutionId, setSelectedExecutionId] = useState<string | null>(null);
  const [selectedExecutions, setSelectedExecutions] = useState<string[]>([]);

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
          selectedExecutions,
          setSelectedExecutions,
        }}
      >
        <div className={style.executionsView}>
          <Toolbar>
            <>
              <div className={style.toolbarLeft}>
                <DownloadSelectedExecutionButtons />
                <DeleteSelectedExecutionsButton />
                <Divider />
                <DeleteAllExecutionsButton />
              </div>
              <div className={style.toolbarRight}>
                <RoutineSelector />
              </div>
            </>
          </Toolbar>
          <ExecutionsContainer />
        </div>
      </executionContext.Provider>
    </ConfigProvider>
  );
};

export default Executions;
