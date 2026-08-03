import React from "react";
import style from "./style.module.css";

type SwitchProps = {
    checked: boolean;
    onChange: (checked: boolean) => void;
    disabled?: boolean;
};

const Switch = ({ checked, onChange, disabled }: SwitchProps) => (
    <div
        className={`${style.track} ${checked ? style.on : ""} ${disabled ? style.disabled : ""}`}
        onClick={() => !disabled && onChange(!checked)}
        role="switch"
        aria-checked={checked}
        tabIndex={disabled ? -1 : 0}
        onKeyDown={(e) => {
            if (!disabled && (e.key === "Enter" || e.key === " ")) {
                e.preventDefault();
                onChange(!checked);
            }
        }}
    >
        <div className={`${style.knob} ${checked ? style.knobOn : ""}`} />
    </div>
);

export default Switch;
