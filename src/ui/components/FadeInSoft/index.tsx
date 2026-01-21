import React from 'react';
import styles from './styles.module.css';

export const FadeInSoft = ({ children, delay, transitionTime, disable }: { children: React.ReactNode; disable?: boolean; delay?: string; transitionTime?: string }) => {
    return (
        <div 
            className={styles.fadeInSoft}
            style={{
                opacity: disable === true ? 1 : undefined,
                animationDelay: delay || '1s',
                animationDuration: transitionTime || '1s'
            }}>
            {children}
        </div>
    );
}   

export default FadeInSoft;