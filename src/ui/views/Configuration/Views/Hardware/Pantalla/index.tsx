import React, { useContext, useEffect, useState } from "react";
import { ScreenControllerContextProvider, ScreenControllerContext } from "@contexts/ScreenControllerContextProvider";
import ScreenTitle from "../../../components/ScreenTitle";
import Row from "../../../components/Row";
import NumberInput from "../../../components/NumberInput";
import Slider from "../../../components/Slider";
import style from "./style.module.css";

const PantallaContent = () => {
    const context = useContext(ScreenControllerContext);
    if (!context) throw new Error("Pantalla debe usarse dentro de ScreenControllerContextProvider");

    const { autoOffTimeMs, setAutoOffTimeMs, maxBrightness, setMaxBrightness } = context;

    const autoOffMinutes = Math.floor(autoOffTimeMs / 60000);
    const [localBrightness, setLocalBrightness] = useState(maxBrightness);

    useEffect(() => {
        setLocalBrightness(maxBrightness);
    }, [maxBrightness]);

    const autoOffDisplay = autoOffMinutes === 0
        ? "Nunca se apaga automáticamente."
        : `Se apaga tras ${autoOffMinutes} min de inactividad.`;

    return (
        <div className={style.wrapper}>
            <ScreenTitle
                title="Configuración de Pantalla"
                description="Ajustes de energía y brillo de las pantallas conectadas."
            />
            <Row label="Apagado automático" description={autoOffDisplay}>
                <NumberInput
                    min={0}
                    max={60}
                    value={autoOffMinutes}
                    onChange={(v) => setAutoOffTimeMs(v * 60000)}
                />
                <span className={style.unit}>min</span>
            </Row>
            <div className={style.brightnessBlock}>
                <div className={style.brightnessHeader}>
                    <div className={style.label}>Brillo máximo</div>
                    <div className={style.value}>{localBrightness}%</div>
                </div>
                <Slider
                    min={1}
                    max={100}
                    value={localBrightness}
                    onChange={setLocalBrightness}
                    onChangeComplete={setMaxBrightness}
                />
            </div>
        </div>
    );
};

const Pantalla = () => (
    <ScreenControllerContextProvider isPreview={true}>
        <PantallaContent />
    </ScreenControllerContextProvider>
);

export default Pantalla;
