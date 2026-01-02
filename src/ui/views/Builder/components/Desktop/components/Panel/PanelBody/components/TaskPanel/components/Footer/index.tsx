import React, { useContext, useEffect, useState } from 'react';
import style from './style.module.css'
import { Button, message, Modal, Popconfirm } from 'antd';
import { taskContext } from '../..';
import { ProjectContext } from '@contexts/projectContextProvider';
import { useNavigate, useParams } from 'react-router-dom';
import { nanoid } from 'nanoid';

const Footer = () => {
    const Navigation = useNavigate()
    const { routineId, taskId, groupId } = useParams()
    const { project, setProject } = useContext(ProjectContext)
    const { task, taskInstanceId } = useContext(taskContext)
    const [allowSaving, setAllowSaving] = useState(false)
    const [isNewTask, setIsNewTask] = useState(taskId === "newTask")
    const [deleteModalVisible, setDeleteModalVisible] = useState(false)
    const [deleteOption, setDeleteOption] = useState<'reference-only' | 'full' | null>(null)

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
        const instanceId = nanoid(8)
        thisRoutine.tasksId.push({ id: instanceId, taskId })
        setProject({ ...project })
        message.success('Tarea agregada a la rutina correctamente')
        Navigation(`/builder/${groupId}/${routineId}/task/${taskId}?instanceId=${instanceId}`)
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
        thisRoutine.tasksId.push({ id: nanoid(8), taskId: task.id })
        setProject({ ...project })
        message.success('Tarea agregada a la rutina correctamente')
    }

    const countHowManyTimesTaskIsUsedInThisProject = (taskId: string) => {
        if (!project) return 0;
        let count = 0;
        project.routines.forEach(r => {
            if (r.tasksId) {
                count += r.tasksId.filter((taskInstance: any) => {
                    if (typeof taskInstance === 'string')
                        return taskInstance === taskId;
                    return taskInstance.taskId === taskId;
                }).length
            }
        })
        return count;
    }

    const taskExistInThisRoutine = () => {
        if (isNewTask) return false;
        if (!task || !routineId) return false;
        
        const thisRoutine = project?.routines.find(r => r.id === routineId);
        if (!thisRoutine || !thisRoutine.tasksId) return false;
        
        const taskExists = thisRoutine.tasksId.some((taskInstance: any) => {
            if (taskInstanceId) {
                if (typeof taskInstance === 'string')
                    return taskInstance === taskInstanceId;
                return taskInstance.id === taskInstanceId;
            }
            if (typeof taskInstance === 'string')
                return taskInstance === task.id;
            return taskInstance.taskId === task.id;
        });
        
        return taskExists;
    }

    const handleOnDeleteTask = (option?: 'reference-only' | 'full') => {
        if (!project || !task) return;
        const thisRoutine = project.routines.find(r => r.id === routineId)
        if (!thisRoutine) return;
        if (!thisRoutine.tasksId) thisRoutine.tasksId = []

        const routineTaskInstances = thisRoutine.tasksId.filter((taskInstance: any) => {
            if (typeof taskInstance === 'string')
                return taskInstance === task.id;
            return taskInstance.taskId === task.id;
        })

        const instanceIdToRemove = taskInstanceId || (routineTaskInstances[0] && (typeof routineTaskInstances[0] === 'string' ? routineTaskInstances[0] : routineTaskInstances[0].id));

        const findRoutineIndex = () => {
            if (!instanceIdToRemove) return -1;
            return thisRoutine.tasksId.findIndex((taskInstance: any) => {
                if (typeof taskInstance === 'string')
                    return taskInstance === instanceIdToRemove;
                return taskInstance.id === instanceIdToRemove;
            })
        }

        if (routineTaskInstances.length > 1) {
            const index = findRoutineIndex()
            if (index > -1) {
                thisRoutine.tasksId.splice(index, 1)
                setProject({ ...project })
            }
            message.success('Una instancia de la tarea ha sido eliminada de la rutina correctamente')
        } else {
            const totalUsageCount = countHowManyTimesTaskIsUsedInThisProject(task.id)
            const index = findRoutineIndex()
            if (index > -1) {
                thisRoutine.tasksId.splice(index, 1)
            }
            if (totalUsageCount == 1) {
                // Si el usuario elige eliminar del proyecto o es la única referencia
                if (option === 'full') {
                    const taskIndex = project.tasks.findIndex(t => t.id === task.id)
                    if (taskIndex !== -1) {
                        project.tasks.splice(taskIndex, 1)
                        setProject({ ...project })
                        message.success('Tarea eliminada del proyecto correctamente')
                        Navigation(-1)
                        return
                    }
                } else if (option === 'reference-only') {
                    // Solo eliminar la referencia de la rutina
                    setProject({ ...project })
                    message.success('Tarea eliminada de la rutina correctamente')
                    Navigation(-1)
                    return
                }
            }
            setProject({ ...project })
            message.success('Tarea eliminada de la rutina correctamente')
        }

        Navigation(-1)

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
                    }}
                    disabled={!allowSaving}
                    type={isNewTask ? 'primary' : 'default'}
                    style={{ width: '100%' }}>
                    {
                        isNewTask ? "Crear y Añadir" : "Actualizar"
                    }
                </Button>
            </div>
            <Modal
                styles={{ root: { width: "15rem" } }}
                title={
                    countHowManyTimesTaskIsUsedInThisProject(task?.id || '') == 1
                        ?
                        "¿Cómo desea eliminar esta tarea?"
                        :
                        "¿Está seguro de eliminar esta tarea de la rutina?"
                }
                open={deleteModalVisible}
                onCancel={() => setDeleteModalVisible(false)}
                footer={countHowManyTimesTaskIsUsedInThisProject(task?.id || '') == 1 ? [
                    <Button key="cancel" onClick={() => setDeleteModalVisible(false)}>
                        Cancelar
                    </Button>,
                    <Button 
                        key="reference" 
                        onClick={() => {
                            setDeleteModalVisible(false)
                            handleOnDeleteTask('reference-only')
                        }}
                        style={{ color: 'var(--warning)' }}>
                        Solo de esta rutina
                    </Button>,
                    <Button 
                        key="full" 
                        type="primary"
                        danger
                        onClick={() => {
                            setDeleteModalVisible(false)
                            handleOnDeleteTask('full')
                        }}>
                        Eliminar del proyecto
                    </Button>,
                ] : [
                    <Button key="cancel" onClick={() => setDeleteModalVisible(false)}>
                        Cancelar
                    </Button>,
                    <Button 
                        key="delete"
                        type="primary"
                        danger
                        onClick={() => {
                            setDeleteModalVisible(false)
                            handleOnDeleteTask()
                        }}>
                        Eliminar
                    </Button>,
                ]}>
                {
                    countHowManyTimesTaskIsUsedInThisProject(task?.id || '') == 1
                        ? "No quedan mas referencias a esta tarea en el proyecto, puede optar por eliminarla completamente o solo quitarla de esta rutina. Si quiere usar esta tarea en el futuro quizás quiera conservarla, de lo contrario deberá volver a crearla si la elimina del proyecto."
                        : null
                }
            </Modal>
            {
                isNewTask || !taskExistInThisRoutine() ? null :
                    <Button
                        onClick={() => setDeleteModalVisible(true)}
                        type='link'
                        style={{ width: '100%', color: 'var(--error)' }}>
                        Eliminar Tarea
                    </Button>
            }
        </div>
    );
}

export default Footer;