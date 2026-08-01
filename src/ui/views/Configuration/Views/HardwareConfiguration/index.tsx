import React from "react";
import style from "./style.module.css";
import { Alert } from "antd";
import HardwareTabNavigation from "./components/HardwareTabNavigation";
import { NetworkInterfacesProvider } from "@contexts/NetworkInterfacesContext";
import useProject from "@hooks/useProject";
import DisableWrapper from "@components/DisableWrapper";

const HardwareConfiguration = () => {
    const { project } = useProject({ fetchProject: false });

    return (
        <NetworkInterfacesProvider>
            <div className={style.hardwareConfiguration}>
                {!project && (
                    <Alert
                        className={style.lockedAlert}
                        type="warning"
                        showIcon
                        message="No hay un proyecto cargado"
                        description="Abrí o creá un proyecto para poder editar Redes, Pantalla, Sonido y Zona Horaria."
                    />
                )}
                <div className={style.tabsArea}>
                    <DisableWrapper disable={!project}>
                        <HardwareTabNavigation />
                    </DisableWrapper>
                </div>
            </div>
        </NetworkInterfacesProvider>
    );
}

export default HardwareConfiguration;