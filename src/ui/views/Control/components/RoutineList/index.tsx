import React from "react";
import style from "./style.module.css";
import Routine from "../Routine";
import useProject from "@hooks/useProject";

const RoutineList = () => {

    const {project} = useProject({fetchProject: true})

    return (
        <div className={style.routineList}>
            <div className={style.routinesContainer}>
                {
                    !project?.routines ? (
                        <div className={style.noRoutines}>
                            <p>No routines available.</p>
                        </div>
                    ) :
                    project.routines.filter(r => !r.hidden).map((routine) =>
                        <Routine key={routine.id} routineData={routine} />
                    )
                }
            </div>
        </div>
    );
}

export default RoutineList;