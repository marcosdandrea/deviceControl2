import React, { useRef } from "react";
import style from "./style.module.css";

type Ipv4GroupProps = {
    value: number[];
    onChange: (index: number, value: number) => void;
    disabled?: boolean;
    placeholder?: number[];
    invalid?: boolean;
    softBorder?: boolean;
};

const Ipv4Group = ({ value, onChange, disabled, placeholder, invalid, softBorder }: Ipv4GroupProps) => {
    const refs = [useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null)];

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
        if (e.key === "." && index < 3) {
            e.preventDefault();
            refs[index + 1].current?.focus();
            refs[index + 1].current?.select();
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
        const raw = e.target.value.replace(/[^\d]/g, "");
        const num = Math.min(255, Math.max(0, Number(raw) || 0));
        onChange(index, num);
        if (raw.length >= 3 && index < 3) {
            refs[index + 1].current?.focus();
            refs[index + 1].current?.select();
        }
    };

    return (
        <div className={style.group}>
            {[0, 1, 2, 3].map((i) => (
                <input
                    key={i}
                    ref={refs[i]}
                    className={`${style.fragment} ${invalid ? style.invalid : ""} ${softBorder ? style.soft : ""}`}
                    disabled={disabled}
                    value={value[i] ?? 0}
                    placeholder={placeholder ? String(placeholder[i]) : undefined}
                    onChange={(e) => handleChange(e, i)}
                    onKeyDown={(e) => handleKeyDown(e, i)}
                    inputMode="numeric"
                />
            ))}
        </div>
    );
};

export default Ipv4Group;
