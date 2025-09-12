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

export const taskContext = createContext({ task: undefined, setTask: (task) => { }, defaultTask: undefined });

const defaultTask = {
    id: nanoid(8),
    name: '',
    description: '',
    retries: 3,
    waitBeforeRetry: 15000,
    continueOnError: true,
    job: { type: '', params: {},  },
} 

const TaskPanel = () => {
    const { taskId } = useParams()
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
                    addonBefore='Timeout (ms)'
                    type='number'
                    min={0}
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