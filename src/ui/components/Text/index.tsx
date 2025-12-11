import React, { useMemo } from 'react';
import styles from './style.module.css';

const Text = React.memo(({text, color, size, fontFamily, uppercase, style, ellipsis=true, children, className} : {text?: string, color?: string, size?: number, fontFamily?: string, uppercase?: boolean, ellipsis?: boolean, style?: React.CSSProperties, children?: React.ReactNode, className?: string}) => {
    
    const textStyle = useMemo(() => {
        const baseStyle: React.CSSProperties = {
            color, 
            fontSize: size, 
            fontFamily, 
            ...style
        };
        
        // Solo aplicar estilos por defecto si no hay className personalizada
        if (!className) {
            return baseStyle;
        }
        
        return baseStyle;
    }, [color, size, fontFamily, style, className]);

    const displayText = useMemo(() => 
        uppercase && text ? text.toUpperCase() : text
    , [text, uppercase]);

    const computedClassName = useMemo(() => {
        if (className) {
            // Si hay className personalizada, solo usar esa y ellipsis si aplica
            return `${className} ${ellipsis ? styles.ellipsis : ''}`;
        }
        // Si no hay className, usar estilos por defecto
        return `${styles.text} ${ellipsis ? styles.ellipsis : ''}`;
    }, [className, ellipsis]);

    return (
        <span 
            className={computedClassName}
            title={text}
            style={textStyle}>
            {displayText}
            {children}
        </span>
    );
});

export default Text;
