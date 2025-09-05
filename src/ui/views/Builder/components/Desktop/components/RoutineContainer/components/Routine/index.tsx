import style from './style.module.css';
import React, { createContext } from 'react';
import RoutineHeader from './components/RoutineHeader';

export const routineContext = createContext(null)

const Routine = ({ routineData }) => {
    return (
        <routineContext.Provider value={{routineData}}>
            <div className={style.routine}>
                <RoutineHeader />
            </div>
        </routineContext.Provider>
    );
}

export default Routine;