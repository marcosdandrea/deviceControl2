import React from "react";
import style from './style.module.css';
import useProject from "@hooks/useProject";
import NoProjectOpened from "./components/NoProjectOpened";
import Background from "./components/Background";
import RoutineTabsContainer from "./components/RoutineTabsContainer";

const Desktop = () => {
    const { project } = useProject({fetchProject: true})
    return (
        <div className={style.desktop}>
            {
                project
                ? <RoutineTabsContainer/>
                : <NoProjectOpened />
            }
            <Background />
        </div>
    );
}

export default Desktop;