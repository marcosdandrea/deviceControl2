import React from "react";
import style from './style.module.css';
import RoutineContainer from "./components/RoutineContainer";
import useProject from "@hooks/useProject";
import NoProjectOpened from "./components/NoProjectOpened";
import Background from "./components/Background";

const Desktop = () => {
    const { project } = useProject({fetchProject: true})
    return (
        <div className={style.desktop}>
            {
                project
                ? <RoutineContainer />
                : <NoProjectOpened />
            }
            <Background />
        </div>
    );
}

export default Desktop;