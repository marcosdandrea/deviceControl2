import React from 'react';
import style from './style.module.css';
import { Color } from '@common/theme/colors';

const Button = ({ color, icon, text, onClick, enabled = true }: {
    color?: string;
    icon?: React.ReactNode;
    text?: string;
    onClick?: (e: React.MouseEvent<HTMLDivElement>) => void;
    enabled?: boolean;
}) => {

    const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        onClick?.(e);
    };

    return (
        <div
            className={`${style.button} ${enabled ? style.enabled : style.disabled}`}
            style={{ backgroundColor: color ?? Color.primary }} onClick={handleClick}>
            {icon}
            {text}
        </div>
    );
}

export default Button;