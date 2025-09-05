import React from "react";
import style from './style.module.css';
import LoadProjectButton from "./components/LoadProjectButton";
import DownloadProjectButton from "./components/DownloadProjectButton";
import CloseProjectButton from "./components/CloseProjectButton";

const Toolbar = () => {
    return (
        <div className={style.toolbar} >
            <LoadProjectButton />
            <DownloadProjectButton />
            <CloseProjectButton />
        </div>
    );
}

export default Toolbar;