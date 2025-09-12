import React from 'react';
import styles from './style.module.css';

const Text = ({text, color, size, fontFamily, uppercase, style, ellipsis=true, children} : {text?: string, color?: string, size?: number, fontFamily?: string, uppercase?: boolean, ellipsis?: boolean, style?: React.CSSProperties, children?: React.ReactNode}) => {
    return (
        <span 
            className={`${styles.text} ${ellipsis ? styles.ellipsis : ''}`}
            title={text}
            style={{ color, fontSize: size, fontFamily, ...style}}>
            {uppercase ? text.toUpperCase() : text}
            {children}
        </span>
    );
}

export default Text;
