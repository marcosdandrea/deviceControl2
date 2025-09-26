import React, { useContext, useEffect, useState } from "react";
import styles from "./style.module.css";
import useRoutines from "@hooks/useRoutines";
import { Select } from "antd";
import { executionContext } from "@views/Executions";
import useProject from "@hooks/useProject";

const RoutineSelector = () => {
  useProject({ fetchProject: true });

  const { selectedRoutineId, setSelectedRoutineId, setSelectedExecutions } = useContext(executionContext);
  const { routines } = useRoutines();
  const [options, setOptions] = useState([]);

  useEffect(() => {
    console.log(routines);
    setOptions(
      routines.map((routine) => ({
        label: routine.name,
        value: routine.id,
      }))
    );
  }, [routines]);

  const handleOnSelectionChange = (value: string) => {
    setSelectedRoutineId(value);
    setSelectedExecutions([]);
  }

  return (
    <div className={styles.routineSelector}>
      <Select
        style={{ width: "calc(100%)" }}
        placeholder="Seleccione una rutina"
        options={options}
        value={selectedRoutineId}
        onChange={handleOnSelectionChange}
      />
    </div>
  );
};

export default RoutineSelector;
