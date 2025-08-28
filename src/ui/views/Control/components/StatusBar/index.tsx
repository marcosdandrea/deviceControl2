import React from 'react';
import styles from './style.module.css';
import Clock from './components/Clock';
import ProjectNameDisplay from './components/ProjectNameDisplay';
import ServerPortDisplay from './components/ServerPortDisplay';
import ServerConnectionMonitor from './components/ServerConnectionMonitor';

const StatusBar = () => {
    return (
        <div className={styles.statusBar}>
            <div className={styles.segment}>
                <ServerConnectionMonitor />
                <ServerPortDisplay />
            </div>
            <div 
                style={{flex: 1, display: 'flex', justifyContent: 'center'}}
                className={styles.segment}>
                <ProjectNameDisplay />
            </div>
            <div className={styles.segment}>
                <Clock />
            </div>
        </div>);
}

export default StatusBar;