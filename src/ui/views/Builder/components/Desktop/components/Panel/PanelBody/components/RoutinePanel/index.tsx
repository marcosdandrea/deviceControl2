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

const getDefaultRoutine = () => (
    {
        id: nanoid(10),
        name: '',
        description: '',
        tasksId: [],
        triggersId: [],
        enabled: true,
        continueOnError: true,
    }
)


const RoutinePanel = ({ routineId }) => {

    const navigate = useNavigate()
    const {routines} = useRoutines()
    const {routineId: paramRoutineId} = useParams()
    const { project } = useProject({fetchProject: false});
    const [routine, setRoutine] = useState<RoutineType | { id: string }>({ id: nanoid(10) });

    useEffect(()=>{
        if (paramRoutineId == "newRoutine") return
        if (paramRoutineId && routines){
            const routine = routines.find(r => r.id === paramRoutineId)
            if (!routine){
                navigate('/builder')
            }
        }
    }, [paramRoutineId, routines])

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