import React, { createContext, useEffect, useState } from 'react';
import style from './style.module.css'
import JobConfiguration from './components/JobConfiguration';
import Text from '@components/Text';
import { useParams, useSearchParams } from 'react-router-dom';
import useProject from '@hooks/useProject';
import { TaskType } from '@common/types/task.type';
import { nanoid } from 'nanoid';
import { Input } from 'antd';
import ConditionConfiguration from './components/ConditionConfiguration';
import Footer from './components/Footer';
import TaskNameField from './components/TaskNameField';
import WarningIcon from '@components/WarningIcon';
import Header from './components/Header';

export const taskContext = createContext({ task: undefined, setTask: (task) => { }, defaultTask: undefined, taskInstanceId: undefined });

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
    const [searchParams] = useSearchParams();
    const { project } = useProject({ fetchProject: false })
    const [task, setTask] = useState<any>(undefined);
    const taskInstanceId = searchParams.get('instanceId') || undefined;

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
                const tasksInRoutine = (routine.tasksId || []).map((taskInstance: any) => {
                    const taskData = project.tasks.find(t => t.id === taskInstance.taskId || taskInstance);
                    return taskData;
                }).filter(task => task);
                //suma de cada tarea el timeout
                const totalTimeout = tasksInRoutine.reduce((acc, t) => acc + (t?.timeout || 0), 0);

                //si la suma de todos los timeouts de las tareas de la rutina es mayor que el timeout de la rutina, muestra una advertencia
                return (routine.routineTimeout > 0 && totalTimeout >= Number(routine.routineTimeout)) 
                                    
            }
        }
    }

    return (
        <taskContext.Provider value={{ task, setTask, defaultTask, taskInstanceId }}>
            <div className={style.taskPanel}>
                <Header/>
                <div className={style.body}>
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
                    addonBefore={<div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        Timeout (ms)
                        {shouldWarnTaskTimeout() && <WarningIcon blink={false} message="La suma de todos los timeouts de todas las tareas de esta rutina es igual o mayor que el límite máximo de ejecución de la rutina completa. Esto quiere decir que la rutina podría agotar el tiempo asignado de ejecución (timeout) y fallar antes de que todas las tareas hayan finalizado." />}
                    </div>}
                    type='number'
                    status={(task?.timeout === 0 || task?.timeout >= 1000) ? '' : 'error'}
                    min={1000}
                    value={task?.timeout}
                    onChange={(e) => setTask({ ...task, timeout: Number(e.target.value) })} />
                <JobConfiguration />
                <ConditionConfiguration />
                </div>
                <Footer />
            </div>
        </taskContext.Provider>
    );
}

export default TaskPanel;