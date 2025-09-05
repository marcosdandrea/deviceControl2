import React from 'react';
import style from './style.module.css';
import Routine from './components/Routine';
import useProject from '@hooks/useProject';

const RoutineContainer = () => {
    const {project} = useProject()

    return (
        <div className={style.routineContainer}>
            {
                project?.routines.map(routine => (
                    <Routine 
                        key={routine.id} 
                        routineData={routine} />
                ))
            }
        </div>
    );
}
 
export default RoutineContainer;