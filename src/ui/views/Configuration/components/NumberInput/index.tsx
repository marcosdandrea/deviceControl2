import React from "react";
import style from "./style.module.css";

type NumberInputProps = {
    value: number;
    min: number;
    max: number;
    width?: number;
    onChange: (value: number) => void;
};

const NumberInput = ({ value, min, max, width = 56, onChange }: NumberInputProps) => (
    <input
        type="number"
        min={min}
        max={max}
        value={value}
        style={{ width }}
        className={style.input}
        onChange={(e) => onChange(Math.max(min, Math.min(max, Number(e.target.value) || 0)))}
    />
);

export default NumberInput;
