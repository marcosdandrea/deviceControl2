import React from "react";
import style from './style.module.css';
import RoutineContainer from "./components/RoutineContainer";
import useProject from "@hooks/useProject";

const Desktop = () => {
    const { project } = useProject({fetchProject: true})
    return (
        <div className={style.desktop}>
            {
                project &&
                <RoutineContainer />
            }
        </div>
    );
}

export default Desktop;