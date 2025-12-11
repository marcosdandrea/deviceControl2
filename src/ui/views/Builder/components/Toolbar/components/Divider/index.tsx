import React from "react";
import styles from './style.module.css';

const Divider = React.memo(() => {
    return (
        <div className={styles.divider} />
    );
});

Divider.displayName = 'Divider';
 
export default Divider;