import React from "react";
import { Slider } from "antd";
import { ScreenControllerContext } from "@contexts/ScreenControllerContextProvider";
import style from "./style.module.css";

const MaxBrightness = () => {
    const context = React.useContext(ScreenControllerContext);

    if (!context) {
        throw new Error("MaxBrightness must be used within a ScreenControllerContextProvider");
    }

    const { maxBrightness, setMaxBrightness } = context;
    // Estado local para reflejar el arrastre en vivo sin persistir en cada pixel.
    const [localValue, setLocalValue] = React.useState<number>(maxBrightness);

    React.useEffect(() => {
        setLocalValue(maxBrightness);
    }, [maxBrightness]);

    return (
        <div className={style.wrapper}>
            <Slider
                className={style.slider}
                min={1}
                max={100}
                step={1}
                value={localValue}
                onChange={setLocalValue}
                onChangeComplete={setMaxBrightness}
            />
            <span className={style.value}>{localValue}%</span>
        </div>
    );
}

export default MaxBrightness;
