import React from "react";
import style from "./style.module.css";
import Routine from "../Routine";
import useProject from "@hooks/useProject";
import MinifiedStatusView from "../MinifiedStatusView";

export const globalRoutineStatusContext = React.createContext<{
  globalRoutineStatus: { routineId: string; status: string }[];
  setGlobalRoutineStatus: React.Dispatch<
    React.SetStateAction<{ routineId: string; status: string }[]>
  >;
}>({ globalRoutineStatus: [], setGlobalRoutineStatus: () => {} });

const RoutineList = () => {
  const { project } = useProject({ fetchProject: true });
  const [globalRoutineStatus, setGlobalRoutineStatus] = React.useState<
    { routineId: string; status: string }[]
  >([]);

  console.log(project);

  return (
    <globalRoutineStatusContext.Provider
      value={{ globalRoutineStatus, setGlobalRoutineStatus }}
    >
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
              {project.routines
                .filter((r) => !r.hidden)
                .map((routine) => (
                  <Routine key={routine.id} routineData={routine} />
                ))}
            </div>
          </div>
          <MinifiedStatusView />
        </div>
      )}
    </globalRoutineStatusContext.Provider>
  );
};

export default RoutineList;
