import React from "react";
import style from "./style.module.css";
import HardwareTabNavigation from "./components/HardwareTabNavigation";
import { NetworkInterfacesProvider } from "@contexts/NetworkInterfacesContext";

const HardwareConfiguration = () => {
    return (
        <NetworkInterfacesProvider>
            <div className={style.hardwareConfiguration}>
                <div className={style.tabsArea}>
                    <HardwareTabNavigation />
                </div>
            </div>
        </NetworkInterfacesProvider>
    );
}

export default HardwareConfiguration;