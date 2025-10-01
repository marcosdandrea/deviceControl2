import React from "react";
import style from "./style.module.css";
import Routine from "../Routine";
import useProject from "@hooks/useProject";
import MinifiedStatusView from "../MinifiedStatusView";

export const globalRoutineStatusContext = React.createContext<{ globalRoutineStatus: { routineId: string, status: string }[], setGlobalRoutineStatus: React.Dispatch<React.SetStateAction<{ routineId: string, status: string }[]>> }>({ globalRoutineStatus: [], setGlobalRoutineStatus: () => { } });

const RoutineList = () => {

    const { project } = useProject({ fetchProject: true })
    const [globalRoutineStatus, setGlobalRoutineStatus] = React.useState<{ routineId: string, status: string }[]>([]);

    return (
        <globalRoutineStatusContext.Provider value={{ globalRoutineStatus, setGlobalRoutineStatus }}>
            <div className={style.routineListView}>
                <div className={style.routineList}>
                    <div className={style.routinesContainer}>
                        {
                            !project?.routines ? (
                                <div className={style.noRoutines}>
                                    <p>No hay rutinas para mostrar</p>
                                </div>
                            ) :
                                project.routines.filter(r => !r.hidden).map((routine) =>
                                    <Routine key={routine.id} routineData={routine} />
                                )
                        }
                    </div>
                </div>
            <MinifiedStatusView />
            </div>
        </globalRoutineStatusContext.Provider>
    );
}

export default RoutineList;