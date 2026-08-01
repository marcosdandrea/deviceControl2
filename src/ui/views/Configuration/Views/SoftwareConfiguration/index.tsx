import React from "react";
import style from "./style.module.css";
import SoftwareTabNavigation from "./components/SoftwareTabNavigation";

const SoftwareConfiguration = () => {
    return (
        <div className={style.softwareConfiguration}>
            <SoftwareTabNavigation />
        </div>
    );
}

export default SoftwareConfiguration;
