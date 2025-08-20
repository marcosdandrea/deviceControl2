import React from 'react';
import styles from './style.module.css';
import RoutineList from './components/RoutineList';
import ProjectContextProvider from '@contexts/projectContextProvider';
import ProjectLoader from './components/ProjectLoader';
import StatusBar from './components/StatusBar';
import PasswordProtection from './components/PasswordProtection';

const Control = () => {

    return (
        <div className={styles.controlView}>
            <ProjectContextProvider>
                <ProjectLoader />
                <PasswordProtection>
                    <RoutineList />
                </PasswordProtection>
                <StatusBar />
            </ProjectContextProvider>
        </div>
    );
}

export default Control;