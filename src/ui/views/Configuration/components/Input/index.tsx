import React from "react";
import style from "./style.module.css";

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
    invalid?: boolean;
};

const Input = ({ invalid, className, ...rest }: InputProps) => (
    <input className={`${style.input} ${invalid ? style.invalid : ""} ${className ?? ""}`} {...rest} />
);

export default Input;
