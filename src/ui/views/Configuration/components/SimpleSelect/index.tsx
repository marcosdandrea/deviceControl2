import React, { useEffect, useRef, useState } from "react";
import style from "./style.module.css";

type Option = { value: number; label: string };

type SimpleSelectProps = {
    value: number;
    options: Option[];
    onChange: (value: number) => void;
    disabled?: boolean;
};

const SimpleSelect = ({ value, options, onChange, disabled }: SimpleSelectProps) => {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);
    const current = options.find((o) => o.value === value);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div className={style.wrapper} ref={ref}>
            <div
                className={`${style.trigger} ${disabled ? style.disabled : ""}`}
                onClick={() => !disabled && setOpen((o) => !o)}
            >
                <span>{current?.label ?? ""}</span>
                <svg width="11" height="11" viewBox="0 0 20 20" stroke="#8b8b90" strokeWidth="2" fill="none">
                    <path d="M5 8l5 5 5-5" />
                </svg>
            </div>
            {open && (
                <div className={style.menu}>
                    {options.map((o) => (
                        <div
                            key={o.value}
                            className={`${style.option} ${o.value === value ? style.optionActive : ""}`}
                            onClick={() => {
                                onChange(o.value);
                                setOpen(false);
                            }}
                        >
                            {o.label}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default SimpleSelect;
