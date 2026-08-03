import React from "react";
import style from "./style.module.css";

type ButtonProps = {
    children: React.ReactNode;
    variant?: "primary" | "secondary" | "danger";
    onClick?: () => void;
    disabled?: boolean;
    loading?: boolean;
    compact?: boolean;
};

const Button = ({ children, variant = "secondary", onClick, disabled, loading, compact }: ButtonProps) => (
    <button
        type="button"
        className={`${style.button} ${style[variant]} ${compact ? style.compact : ""}`}
        onClick={onClick}
        disabled={disabled || loading}
    >
        {loading ? "..." : children}
    </button>
);

export default Button;
