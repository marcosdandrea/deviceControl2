import React from 'react';
import styles from './style.module.css';

const Text = ({text, color, size, fontFamily, uppercase, style, children} : {text?: string, color?: string, size?: number, fontFamily?: string, uppercase?: boolean, style?: React.CSSProperties, children?: React.ReactNode}) => {
    return (
        <span 
            className={styles.text}
            style={{ color, fontSize: size, fontFamily, ...style}}>
            {uppercase ? text.toUpperCase() : text}
            {children}
        </span>
    );
}

export default Text;
