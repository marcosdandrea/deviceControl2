import React, { createContext, useEffect, useState } from 'react';
import style from './style.module.css';
import useProject from '@hooks/useProject';
import RoutineName from './component/RoutineName';
import RoutineDescription from './component/RoutineDescription';
import Descriptions from './component/Descriptions';
import Footer from './component/Footer';
import { nanoid } from 'nanoid';
import { RoutineType } from '@common/types/routine.type';

export const routineConfigurationContext = createContext(null)

const getDefaultRoutine = () => (
    {
        id: nanoid(10),
        name: '',
        description: '',
        tasksId: [],
        triggersId: [],
        active: false,
    }
)


const RoutinePanel = ({ routineId }) => {


    const { project } = useProject({fetchProject: false});
    const [routine, setRoutine] = useState<RoutineType | { id: string }>({ id: nanoid(10) });

    useEffect(() => {
        if (routineId && project) {
            const foundRoutine = project.routines.find(r => r.id === routineId);
            setRoutine(foundRoutine || getDefaultRoutine());
        }
    }, [routineId, project])

    return (
        <routineConfigurationContext.Provider value={{ routine, setRoutine }}>
            <div className={style.routinePanel}>
                <RoutineName />
                <RoutineDescription />
                <Descriptions />
                <Footer />
            </div>
        </routineConfigurationContext.Provider>
    );
}

export default RoutinePanel;