import React, { useState, useMemo } from "react";
import style from "./style.module.css";
import Routine from "../Routine";
import useProject from "@hooks/useProject";
import MinifiedStatusView from "../MinifiedStatusView";
import { Empty } from "antd";

export const globalRoutineStatusContext = React.createContext<{
  globalRoutineStatus: { routineId: string; status: string }[];
  setGlobalRoutineStatus: React.Dispatch<
    React.SetStateAction<{ routineId: string; status: string }[]>
  >;
}>({ globalRoutineStatus: [], setGlobalRoutineStatus: () => { } });

const RoutineList = React.memo(({ groupId }: { groupId?: string }) => {
  const { project } = useProject({ fetchProject: false });
  const [globalRoutineStatus, setGlobalRoutineStatus] = React.useState<{ routineId: string; status: string }[]>([]);
  
  const filteredRoutines = useMemo(() => {
    if (!project) return [];
    return project.routines
      .filter(r => (groupId ? r.groupId === groupId : true))
      .filter((r) => !r.hidden);
  }, [project, groupId]);

  const contextValue = useMemo(() => ({
    globalRoutineStatus,
    setGlobalRoutineStatus
  }), [globalRoutineStatus]);

  return (
    <globalRoutineStatusContext.Provider value={contextValue}>
      {!project ? (
        <div className={style.noRoutines}>
          <p className={style.noRoutinesTitle}>No hay proyecto</p>
          <p className={style.noRoutinesSubtitle}>Ve al Builder y crea o carga uno. </p>
        </div>
      ) : project.routines.filter(r => !r.hidden).length === 0 ? (
        <div className={style.noRoutines}>
          <p className={style.noRoutinesTitle}>
            No hay rutinas para mostrar en este proyecto.
          </p>
          <p className={style.noRoutinesSubtitle}>
            Aquí se mostrarán todas tus rutinas visibles.
          </p>
        </div>
      ) : (
        <div className={style.routineListView}>
          <div className={style.routineList}>
            <div className={style.routinesContainer}>
              {
                filteredRoutines.length > 0
                  ? filteredRoutines.map((routine) => (
                    <Routine key={routine.id} routineData={routine} />
                  )) 
                  : <Empty description="No hay rutinas en este grupo." />}
            </div>
          </div>
          <MinifiedStatusView groupId={groupId} />
        </div>
      )}
    </globalRoutineStatusContext.Provider>
  );
});

export default RoutineList;
