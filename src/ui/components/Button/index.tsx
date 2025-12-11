import React, { useMemo } from 'react';
import style from './style.module.css';
import { Color } from '@common/theme/colors';

const Button = React.memo(({ color, icon, text, onClick, styles, enabled = true }: {
    color?: string;
    icon?: React.ReactNode;
    text?: string;
    onClick?: (e: React.MouseEvent<HTMLDivElement>) => void;
    styles?: React.CSSProperties;
    enabled?: boolean;
}) => {

    const buttonStyle = useMemo(() => ({
        backgroundColor: color ?? Color.primary,
        ...styles
    }), [color, styles]);

    const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        onClick?.(e);
    };

    return (
        <div
            className={`${style.button} ${enabled ? style.enabled : style.disabled}`}
            style={buttonStyle} onClick={handleClick}>
            {icon}
            {text}
        </div>
    );
});

export default Button;