import React from 'react';
import styles from './style.module.css';

const Text = ({text, color, size, fontFamily, uppercase, style} : {text: string, color?: string, size?: number, fontFamily?: string, uppercase?: boolean, style?: React.CSSProperties}) => {
    return (
        <span 
            className={styles.text}
            style={{ color, fontSize: size, fontFamily, ...style}}>
            {uppercase ? text.toUpperCase() : text}
        </span>
    );
}

export default Text;
