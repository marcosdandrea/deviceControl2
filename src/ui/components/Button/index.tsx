import React from 'react';
import style from './style.module.css';

const Button = ({color, icon, onClick, enabled=true}) => {
    return (
        <div
            className={`${style.button} ${enabled ? style.enabled : style.disabled}`}
            style={{ backgroundColor: color }} onClick={onClick}>
            {icon}
        </div>
    );
}
 
export default Button;