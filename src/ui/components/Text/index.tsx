import React, { useMemo } from 'react';
import styles from './style.module.css';

const Text = React.memo(({text, color, size, fontFamily, uppercase, style, ellipsis=true, children, className} : {text?: string, color?: string, size?: number, fontFamily?: string, uppercase?: boolean, ellipsis?: boolean, style?: React.CSSProperties, children?: React.ReactNode, className?: string}) => {
    
    const textStyle = useMemo(() => ({
        color, 
        fontSize: size, 
        fontFamily, 
        ...style
    }), [color, size, fontFamily, style]);

    const displayText = useMemo(() => 
        uppercase && text ? text.toUpperCase() : text
    , [text, uppercase]);

    return (
        <span 
            className={`${styles.text} ${ellipsis ? styles.ellipsis : ''} ${className ?? ''}`}
            title={text}
            style={textStyle}>
            {displayText}
            {children}
        </span>
    );
});

export default Text;
