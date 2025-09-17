import React, { useContext, useEffect } from 'react';
import style from './style.module.css'
import Text from '@components/Text';
import { taskContext } from '../..';
import { MdCopyAll } from 'react-icons/md';
import { message, Tooltip } from 'antd';
import { nanoid } from 'nanoid';
import useProject from '@hooks/useProject';
import { useNavigate, useParams } from 'react-router-dom';

const Header = () => {

    const {routineId, taskId} = useParams()
    const { task, setTask } = useContext<any>(taskContext)
    const { project, setProject } = useProject({ fetchProject: false })
    const [isANewTask, setIsANewTask] = React.useState(false)
    const navigate = useNavigate()

    useEffect(() => {
        if (!project || !task) return
        const taskExistsInProject = project?.tasks.find(t => t.id === task.id)
        setIsANewTask(!taskExistsInProject)
    }, [task, project])

    const handleOnDuplicateComponent = () => {
        if (!project || !task) return;
        const newTask = { ...task, id: nanoid(8), name: task.name + " (Copia)" }
        setTask(newTask)
        const routine = project.routines.find(r => r.id === routineId)
        const taskInstanceId = nanoid(8);
        if (routine) {
            routine.tasksId = [...(routine.tasksId || []), { taskId: newTask.id, id: taskInstanceId }]
        }
        project.tasks.push(newTask)
        setProject({ ...project })
        navigate(`/builder/${routineId}/task/${newTask.id}?instanceId=${taskInstanceId}`)
        console.log(`/builder/${routineId}/task/${newTask.id}?instanceId=${taskInstanceId}`)
        message.success('Componente duplicado correctamente.')
    }

    return (
        <div className={style.header}>
            <Text
                fontFamily='Open Sans Light'
                style={{ width: "auto", overflow: "visible", marginRight: "8px" }}
                color='white'>
                Tarea:
            </Text>
            <Text
                fontFamily='Open Sans SemiBold'
                color='white'>
                {task?.name}
            </Text>
            {
                !isANewTask &&
                <Tooltip title="Duplicar este componente, creando una nueva copia en el proyecto con todas las características de este.">
                    <div 
                        onClick={handleOnDuplicateComponent}
                        className={style.button}>
                        <MdCopyAll size={20} color='#fff' />
                    </div>
                </Tooltip>
            }
        </div>);
}

export default Header;