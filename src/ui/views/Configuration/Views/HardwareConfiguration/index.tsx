import React from "react";
import style from "./stye.module.css";
import HardwareTabNavigation from "./components/HardwareTabNavigation";

const HardwareConfiguration = () => {
    return (
        <div className={style.hardwareConfiguration}>
            <HardwareTabNavigation />
        </div>
    );
}

export default HardwareConfiguration;