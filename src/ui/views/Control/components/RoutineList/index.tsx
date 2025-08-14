import React, { useContext } from "react";
import style from "./style.module.css";
import Routine from "../Routine";
import { ProjectContext } from "@contexts/projectContextProvider";

const RoutineList = () => {

    const { project } = useContext(ProjectContext);

    if (!project)
        return null
    return (
        <div className={style.routineList}>
            {
                project.routines.map((routine) =>
                    <Routine key={routine.id} routineData={routine} />
                )
            }
        </div>
    );
}

export default RoutineList;