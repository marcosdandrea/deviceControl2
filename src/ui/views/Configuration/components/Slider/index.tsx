import React from "react";
import style from "./style.module.css";

type SliderProps = {
    min: number;
    max: number;
    value: number;
    onChange: (value: number) => void;
    onChangeComplete?: (value: number) => void;
};

/** Réplica del truco del mockup: barra de relleno dibujada a mano + <input type="range">
 * transparente superpuesto para la interacción real (arrastre, teclado, accesibilidad). */
const Slider = ({ min, max, value, onChange, onChangeComplete }: SliderProps) => {
    const percentage = ((value - min) / (max - min)) * 100;

    return (
        <div className={style.wrapper}>
            <div className={style.track}>
                <div className={style.fill} style={{ width: `${percentage}%` }} />
            </div>
            <input
                type="range"
                min={min}
                max={max}
                value={value}
                className={style.input}
                onChange={(e) => onChange(Number(e.target.value))}
                onMouseUp={(e) => onChangeComplete?.(Number((e.target as HTMLInputElement).value))}
                onTouchEnd={(e) => onChangeComplete?.(Number((e.target as HTMLInputElement).value))}
                onKeyUp={(e) => onChangeComplete?.(Number((e.target as HTMLInputElement).value))}
            />
        </div>
    );
};

export default Slider;
