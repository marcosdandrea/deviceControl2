import React from "react";
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

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setLocalValue(Number(e.target.value));
    };

    const commitValue = (e: React.SyntheticEvent<HTMLInputElement>) => {
        setMaxBrightness(Number((e.target as HTMLInputElement).value));
    };

    return (
        <div className={style.wrapper}>
            <input
                className={style.range}
                type="range"
                min={1}
                max={100}
                step={1}
                value={localValue}
                onChange={handleChange}
                onMouseUp={commitValue}
                onTouchEnd={commitValue}
                onKeyUp={commitValue}
            />
            <span className={style.value}>{localValue}%</span>
        </div>
    );
}

export default MaxBrightness;
