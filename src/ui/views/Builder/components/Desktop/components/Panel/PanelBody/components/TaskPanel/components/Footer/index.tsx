import React, { useContext, useEffect, useState } from 'react';
import style from './style.module.css'
import { Button, message, Popconfirm } from 'antd';
import { taskContext } from '../..';
import { ProjectContext } from '@contexts/projectContextProvider';
import { useNavigate, useParams } from 'react-router-dom';

const Footer = () => {
    const Navigation = useNavigate()
    const { routineId, taskId } = useParams()
    const { project, setProject } = useContext(ProjectContext)
    const { task } = useContext(taskContext)
    const [allowSaving, setAllowSaving] = useState(false)
    const [isNewTask, setIsNewTask] = useState(taskId === "newTask")

    useEffect(() => {
        if (!task) {
            setAllowSaving(false)
            return
        }

        const taskExistsInProject = project?.tasks.find(t => t.id === task.id)
        setIsNewTask(!taskExistsInProject)

        const jobHasNoType = () => {
            if (!task.job) return true
            if (task.job.type == "") return true
            return false
        }

        const hasJobInvalidParams = () => {
            if (!task.job || !task.job.invalidParams) return false
            return task.job.invalidParams.length > 0
        }

        const conditionHasInvalidParams = () => {
            if (!task.condition) return false
            if (!task.condition.invalidParams) return false
            return task.condition.invalidParams.length > 0
        }

        if (task.name.trim() === "" || jobHasNoType() || hasJobInvalidParams() || conditionHasInvalidParams() || task.timeout < 1000) {
            setAllowSaving(false);
            return;
        }
        setAllowSaving(true)

    }, [task, project])

    const updateTaskInProject = (updatedTask) => {
        if (!project) return;
        const taskIndex = project.tasks.findIndex(t => t.id === updatedTask.id)
        if (taskIndex !== -1) {
            project.tasks[taskIndex] = updatedTask
            setProject({ ...project })
            message.success('Tarea actualizada correctamente')
        }
    }

    const addTaskToProject = (newTask) => {
        if (!project) return;
        project.tasks.push(newTask)
        setProject({ ...project })
        message.success('Tarea creada correctamente')
    }

    const addTaskToRoutine = (routineId, taskId) => {
        if (!project) return;
        const thisRoutine = project.routines.find(r => r.id === routineId)
        if (!thisRoutine) return;
        if (!thisRoutine.tasksId) thisRoutine.tasksId = []
        thisRoutine.tasksId.push(taskId)
        setProject({ ...project })
        message.success('Tarea agregada a la rutina correctamente')
    }

    const handleOnAddTaskToRoutine = () => {
        if (!project || !task) return;
        const projectAlreadyHasThisTask = project.tasks.some(t => t.id === task.id)
        if (!projectAlreadyHasThisTask) {
            project.tasks.push(task)
            message.success('Tarea creada correctamente y agregada a la rutina')
        }
        const thisRoutine = project.routines.find(r => r.id === routineId)
        if (!thisRoutine) return;
        if (!thisRoutine.tasksId) thisRoutine.tasksId = []
        thisRoutine.tasksId.push(task.id)
        setProject({ ...project })
        message.success('Tarea agregada a la rutina correctamente')
        Navigation("/builder")
    }

    const countHowManyTimesTaskIsUsedInThisProject = (taskId: string) => {
        if (!project) return 0;
        let count = 0;
        project.routines.forEach(r => {
            if (r.tasksId && r.tasksId.includes(taskId)) {
                count += r.tasksId.filter(tId => tId === taskId).length
            }
        })
        return count;
    }

    const handleOnDeleteTask = (e) => {
        if (!project || !task) return;
        const thisRoutine = project.routines.find(r => r.id === routineId)
        if (!thisRoutine) return;

        //busca dentro de la rutina actual cuantas veces se está usando esta tarea
        const thisTask = thisRoutine.tasksId?.filter(tId => tId === task.id) || []
        if (thisTask.length > 1) {
            //si la tarea se está usando más de una vez, solo elimina una instancia
            const index = thisRoutine.tasksId.indexOf(task.id)
            if (index > -1) {
                thisRoutine.tasksId.splice(index, 1)
                setProject({ ...project })
            }
            message.success('Una instancia de la tarea ha sido eliminada de la rutina correctamente')
        } else {
            //si la tarea solo se está usando una vez, elimina la tarea de la rutina y del proyecto (si no se está usando en otra rutina)
            if (countHowManyTimesTaskIsUsedInThisProject(task.id) == 1) {
                const taskIndex = project.tasks.findIndex(t => t.id === task.id)
                if (taskIndex !== -1) {
                    project.tasks.splice(taskIndex, 1)
                    message.success('Tarea eliminada del proyecto correctamente')
                    Navigation("/builder")
                }
            } else{
                const index = thisRoutine.tasksId.indexOf(task.id)
                if (index > -1) {
                    thisRoutine.tasksId.splice(index, 1)
                    setProject({ ...project })
                }
                message.success('Tarea eliminada de la rutina correctamente')
            }
        }

    }

    return (
        <div className={style.footer}>
            <div className={style.upperButtons}>
                {
                    !isNewTask && (
                        <Button
                            onClick={()=>{
                                updateTaskInProject(task)
                                addTaskToRoutine(routineId, task.id)
                                Navigation("/builder")
                            }}
                            disabled={!allowSaving}
                            type='primary'
                            style={{ width: '100%' }}>
                            Añadir
                        </Button>)
                }
                <Button
                    onClick={() => {
                        if (isNewTask) {
                            addTaskToProject(task)
                            addTaskToRoutine(routineId, task.id)
                        } else {
                            updateTaskInProject(task)
                        }
                        Navigation("/builder")
                    }}
                    disabled={!allowSaving}
                    type={isNewTask ? 'primary' : 'default'}
                    style={{ width: '100%' }}>
                    {
                        isNewTask ? "Crear y Añadir" : "Actualizar"
                    }
                </Button>

            </div>
            <Popconfirm
                styles={{ root: { width: "15rem" } }}
                title={
                    countHowManyTimesTaskIsUsedInThisProject(task?.id || '') == 1
                        ?
                        "No quedan mas referencias a esta tarea en el proyecto. Si elimina la tarea de esta rutina, se eliminará tambien del proyecto. ¿Desea continuar?"
                        :
                        "¿Está seguro de eliminar esta tarea de la rutina?"
                }
                onConfirm={handleOnDeleteTask}>
                {
                    isNewTask ? null :
                        <Button
                            type='link'
                            style={{ width: '100%', color: 'var(--error)' }}>
                            Eliminar Tarea
                        </Button>
                }
            </Popconfirm>
        </div>
    );
}

export default Footer;