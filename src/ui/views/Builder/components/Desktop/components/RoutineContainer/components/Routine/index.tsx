import style from './style.module.css';
import React, { createContext, forwardRef } from 'react';
import RoutineHeader from './components/RoutineHeader';
import TaskContainer from './components/TaskContainer';
import TriggersContainer from './components/TriggerContainer';
import NewRoutineGhost from './components/NewRoutineGhost';
import { useParams } from 'react-router-dom';

export const routineContext = createContext(null)

interface RoutineProps {
    routineData: any;
}

const Routine = forwardRef<HTMLDivElement, RoutineProps>(({ routineData }, ref) => {

    const { routineId } = useParams();

    if (!routineData)
        return <NewRoutineGhost ref={ref} />

    return (
        <routineContext.Provider value={{ routineData }}>
            <div
                ref={ref}
                className={`${style.routine} ${routineId === routineData.id ? style.selected : ''}`} >
                <RoutineHeader />
                <TriggersContainer />
                <TaskContainer />
            </div>
        </routineContext.Provider>
    );
});

export default Routine;