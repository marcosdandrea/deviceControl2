import React from "react";
import style from "./style.module.css";
import { ScreenControllerContextProvider } from "@contexts/ScreenControllerContextProvider";
import AutoTurnOff from "./components/ScreenAutoTurnOff";
import MaxBrightness from "./components/MaxBrightness";
import SettingsSection from "@components/SettingsSection";
import SettingRow from "@components/SettingRow";

const ScreenConfiguration = () => {
    return (
        <ScreenControllerContextProvider isPreview={true}>
            <div className={style.screenConfiguration}>
                <SettingsSection title="Configuración de Pantalla">
                    <SettingRow label="Apagar Automáticamente">
                        <AutoTurnOff />
                    </SettingRow>
                    <SettingRow label="Brillo Máximo">
                        <MaxBrightness />
                    </SettingRow>
                </SettingsSection>
            </div>
        </ScreenControllerContextProvider>);
}

export default ScreenConfiguration;