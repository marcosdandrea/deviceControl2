import React from 'react';
import styles from './style.module.css';
import Clock from './components/Clock';
import ProjectNameDisplay from './components/ProjectNameDisplay';

const StatusBar = () => {
    return (
        <div className={styles.statusBar}>
            <ProjectNameDisplay />
            <Clock />
        </div>);
}

export default StatusBar;