import React from "react";
import styles from './style.module.css';

const Toolbar = React.memo(({children, style}: {children: React.ReactNode, style?: React.CSSProperties}) => {
    return (
        <div className={styles.toolbar} style={style}>
            {children}
        </div>
    );
});

export default Toolbar;