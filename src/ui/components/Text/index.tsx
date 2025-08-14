import React from 'react';
import style from './style.module.css';

const Text = ({text, color, size, fontFamily, uppercase} : {text: string, color?: string, size?: number, fontFamily?: string, uppercase?: boolean}) => {
    return (
        <span 
            className={style.text}
            style={{ color, fontSize: size, fontFamily}}>
            {uppercase ? text.toUpperCase() : text}
        </span>
    );
}

export default Text;
