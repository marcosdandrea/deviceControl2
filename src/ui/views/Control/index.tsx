import React from 'react';
import RoutineList from './components/RoutineList';
import ProjectContextProvider from '@contexts/projectContextProvider';
import ProjectLoader from './components/ProjectLoader';

const Control = () => {

    return (
        <ProjectContextProvider>
            <ProjectLoader/>
            <RoutineList />
        </ProjectContextProvider>
    );
}

export default Control;