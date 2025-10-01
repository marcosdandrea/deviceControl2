import React, { createContext, useEffect, useState } from 'react';
import style from './style.module.css';
import useProject from '@hooks/useProject';
import RoutineName from './component/RoutineName';
import RoutineDescription from './component/RoutineDescription';
import Descriptions from './component/Descriptions';
import Footer from './component/Footer';
import { nanoid } from 'nanoid';
import { RoutineType } from '@common/types/routine.type';
import useRoutines from '@hooks/useRoutines';
import { useNavigate, useParams } from 'react-router-dom';

export const routineConfigurationContext = createContext(null)

const RoutinePanel = ({ routineId }) => {

    const navigate = useNavigate()
    const { routines, getRoutineTemplate } = useRoutines()
    const { routineId: paramRoutineId } = useParams()
    const { project } = useProject({ fetchProject: false });
    const [routine, setRoutine] = useState<RoutineType | { id: string }>({ id: nanoid(10) });
    const [routineTemplate, setRoutineTemplate] = useState<RoutineType | null>(null)

    useEffect(() => {
        getRoutineTemplate(setRoutineTemplate);
    }, []);

    useEffect(() => {
        if (paramRoutineId == "newRoutine") return
        if (paramRoutineId && routines) {
            const routine = routines.find(r => r.id === paramRoutineId)
            if (!routine) {
                navigate('/builder')
            }
        }
    }, [paramRoutineId, routines])

    useEffect(() => {
        if (routineId && project) {
            const foundRoutine = project.routines.find(r => r.id === routineId);
            if (foundRoutine)
                setRoutine(foundRoutine);
            else 
            setRoutine(routineTemplate);

        }
    }, [routineId, project, routineTemplate])

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