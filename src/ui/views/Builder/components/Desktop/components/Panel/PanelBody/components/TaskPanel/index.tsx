import React, { createContext, useEffect, useState } from 'react';
import style from './style.module.css'
import JobConfiguration from './components/JobConfiguration';
import Text from '@components/Text';
import { useParams } from 'react-router-dom';
import useProject from '@hooks/useProject';
import { TaskType } from '@common/types/task.type';
import { nanoid } from 'nanoid';
import { Input } from 'antd';
import ConditionConfiguration from './components/ConditionConfiguration';
import Footer from './components/Footer';
import TaskNameField from './components/TaskNameField';
import WarningIcon from '@components/WarningIcon';

export const taskContext = createContext({ task: undefined, setTask: (task) => { }, defaultTask: undefined });

const defaultTask = {
    id: nanoid(8),
    name: '',
    description: '',
    retries: 3,
    timeout: 15000,
    waitBeforeRetry: 15000,
    continueOnError: true,
    job: { type: '', params: {},  },
} 

const TaskPanel = () => {
    const { taskId , routineId} = useParams()
    const { project } = useProject({ fetchProject: false })
    const [task, setTask] = useState<any>(undefined);

    useEffect(() => {
        if (project && taskId) {
            const task = project.tasks.find(t => t.id === taskId)
            if (task)
                setTask(task)
            else
                setTask(defaultTask)
        } else {
            setTask(defaultTask)
        }
    }, [project, taskId])

    const shouldWarnTaskTimeout = () => {
        //recopila todas las tareas de la rutina actual
        if (project && routineId && task) {
            const routine = project.routines.find(r => r.id === routineId);
            if (routine) {
                const tasksInRoutine = project.tasks.filter(t => routine.tasksId.includes(t.id));
                //suma de cada tarea el timeout
                const totalTimeout = tasksInRoutine.reduce((acc, t) => acc + (t.timeout || 0), 0);

                //si la suma de todos los timeouts de las tareas de la rutina es mayor que el timeout de la rutina, muestra una advertencia
                return (routine.routineTimeout > 0 && totalTimeout >= Number(routine.routineTimeout)) 
                                    
            }
        }
    }

    return (
        <taskContext.Provider value={{ task, setTask, defaultTask }}>
            <div className={style.taskPanel}>
                <Text color='white'>
                    Configuración de Tarea: {task?.name}
                </Text>
                <TaskNameField />
                <Input.TextArea
                    value={task?.description}
                    rows={3}
                    placeholder='Descripción de la tarea...'
                    onChange={(e) => setTask({ ...task, description: e.target.value })} />
                <Input
                    addonBefore='Reintentos'
                    type='number'
                    min={0}
                    value={task?.retries}
                    onChange={(e) => setTask({ ...task, retries: Number(e.target.value) })} />
                <Input
                    addonBefore='Espera antes de reintentar (ms)'
                    type='number'
                    min={0}
                    value={task?.waitBeforeRetry}
                    onChange={(e) => setTask({ ...task, waitBeforeRetry: Number(e.target.value) })} />
                <Input
                    addonBefore={  <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        Tiempo de espera (ms)
                        {shouldWarnTaskTimeout() && <WarningIcon message="La suma de los tiempos de espera de todas las tareas de esta rutina es mayor o igual que el maximo tiempo de ejecución de la rutina. La rutina podría fallar por timeout antes que se termine de ejecutar una de sus tareas." />}
                    </div>}
                    type='number'
                    status={(task?.timeout === 0 || task?.timeout >= 1000) ? '' : 'error'}
                    min={1000}
                    value={task?.timeout}
                    onChange={(e) => setTask({ ...task, timeout: Number(e.target.value) })} />
                <JobConfiguration />
                <ConditionConfiguration />
                <Footer />
            </div>
        </taskContext.Provider>
    );
}

export default TaskPanel;