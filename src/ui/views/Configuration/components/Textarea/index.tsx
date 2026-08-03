import React from "react";
import style from "./style.module.css";

type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

const Textarea = ({ className, ...rest }: TextareaProps) => (
    <textarea className={`${style.textarea} ${className ?? ""}`} {...rest} />
);

export default Textarea;
