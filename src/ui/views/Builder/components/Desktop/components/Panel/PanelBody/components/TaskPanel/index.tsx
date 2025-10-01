import React, { createContext, useEffect, useState } from 'react';
import style from './style.module.css'
import JobConfiguration from './components/JobConfiguration';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import useProject from '@hooks/useProject';
import { nanoid } from 'nanoid';
import { Input } from 'antd';
import ConditionConfiguration from './components/ConditionConfiguration';
import Footer from './components/Footer';
import TaskNameField from './components/TaskNameField';
import WarningIcon from '@components/WarningIcon';
import Header from './components/Header';
import useRoutines from '@hooks/useRoutines';
import { TaskType } from '@common/types/task.type';
import useTasks from '@hooks/useTasks';

export const taskContext = createContext({ task: undefined, setTask: (task) => { }, defaultTask: undefined, taskInstanceId: undefined });

const TaskPanel = () => {
    const navigate = useNavigate()
    const { taskId, routineId } = useParams()
    const { routines } = useRoutines()
    const [searchParams] = useSearchParams();
    const { project } = useProject({ fetchProject: false })
    const [task, setTask] = useState<any>(undefined);
    const taskInstanceId = searchParams.get('instanceId') || undefined;
    
    const [defaultTask, setDefaultTask] = useState<TaskType | null>(null)
    const {getTaskTemplate} = useTasks()

    useEffect(() => {
        getTaskTemplate(setDefaultTask)
    }, [])
    
    console.log({defaultTask})

    useEffect(() => {
        if (routines && routineId) {
            const routine = routines.find(r => r.id === routineId)
            if (!routine) {
                navigate('/builder')
            }
        }
    }, [routines, routineId])

    useEffect(() => {
        if (project && taskId) {
            const task = project.tasks.find(t => t.id === taskId)
            if (task)
                setTask(task)
            else
                if (taskId === 'newTask') 
                setTask(null)
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
                <Header />
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
                        disabled={task?.id ? false : true}
                        type='number'
                        status={task?.id ? (task?.timeout === 0 || task?.timeout >= 1000) ? '' : 'error' : ''}
                        min={1000}
                        value={task?.timeout}
                        onChange={(e) => setTask({ ...task, timeout: Number(e.target.value) })} />
                    {
                        task?.id &&
                        <>
                            <JobConfiguration />
                            <ConditionConfiguration />
                        </>
                    }
                </div>
                <Footer />
            </div>
        </taskContext.Provider>
    );
}

export default TaskPanel;