import React from "react";
import style from "./stye.module.css";
import HardwareTabNavigation from "./components/HardwareTabNavigation";
import { NetworkInterfacesProvider } from "@contexts/NetworkInterfacesContext";

const HardwareConfiguration = () => {
    return (
        <NetworkInterfacesProvider>
            <div className={style.hardwareConfiguration}>
                <HardwareTabNavigation />
            </div>
        </NetworkInterfacesProvider>
    );
}

export default HardwareConfiguration;