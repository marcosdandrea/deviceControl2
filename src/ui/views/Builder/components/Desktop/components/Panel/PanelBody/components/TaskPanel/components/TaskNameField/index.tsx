
import React, { useContext, useEffect, useState } from "react";
import { Button, Input, message, Select } from "antd";
import { taskContext } from "../..";
import useProject from "@hooks/useProject";
import { nanoid } from "nanoid";
import Text from "@components/Text";
import { MdAdd, MdEdit, MdNewLabel } from "react-icons/md";

const TaskNameField = () => {

    const { task, setTask, defaultTask } = useContext(taskContext)
    const { project, setProject } = useProject({ fetchProject: false })
    const [editNameMode, setEditNameMode] = useState(false)
    const [searchValue, setSearchValue] = useState("")
    const [taskExists, setTaskExists] = useState(false)
    const [searchingMode, setSearchingMode] = useState(false)
    const [currentTask, setCurrentTask] = useState(task?.id || null)

    useEffect(() => {
        if (task) {
            setSearchValue(task.name)
            const taskExists = project?.tasks.find(t => t.name === task.name)
            if (taskExists) {
                setTaskExists(true)
            } else {
                setTaskExists(false)
            }
        } else {
            setSearchValue("")
            setTaskExists(false)
        }
    }, [task])

    const notFoundContent = () => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Text size={14} color='var(--secondary)'>Presione el boton + para crear</Text>
        </div>
    )

    const handleOnCreateNewTask = () => {
        setEditNameMode(false)
        setTask({ ...defaultTask, id: nanoid(8), name: searchValue })
    }

    const handleOnEditTaskName = () => {
        if (!taskExists) 
            return
        
        setEditNameMode(false)
        setSearchingMode(false)
        if (task.name === searchValue) return
        task.name = searchValue
        message.success('Nombre de tarea actualizado')
    }

    const handleOnChangingTaskName = (e) => {
        setSearchValue(e.target.value)
    }

    const handleOnChangeSelect = (value) => {
        setSearchingMode(false)
        const selectedTask = project?.tasks.find(t => t.id === value)
        setSearchValue(selectedTask.name)
        if (selectedTask) {
            setTask(selectedTask)
            setTaskExists(true)
        } else {
            setTask({ ...defaultTask, id: nanoid(8), name: '' })
        }
    }

    const handleOnSearchTask = (value: string) => {
        if (value.trim() === '') return

        setSearchValue(value)
        const taskExists = project?.tasks.find(t => t.name.toLowerCase().includes(value.toLowerCase()))
        if (taskExists) {
            setTask(taskExists)
            setTaskExists(true)
            setSearchingMode(true)
        } else {
            setTaskExists(false)
            setSearchingMode(false)
            setTask(null)
        }
    }

    const handleOnEnableEditNameMode = () => {
        console.log(`Enabling edit mode for task name: ${task.name}`)
        setEditNameMode(true)
    }

    const handleOnSearchingBlurs = () => {
        //setSearchingMode(false)
        //setTaskExists(true)
        //setTask(currentTask)
    }

    const handleOnSearchFocus = () => {
        setCurrentTask(task || null)
        setSearchingMode(true)
    }

    return (
        <Input.Group compact>
            <Input
                style={{
                    width: '80px',
                    color: "var(--text-secondary)",
                    backgroundColor: "var(--component-interactive)",
                    pointerEvents: 'none',
                    borderRight: 0,
                }}
                value="Nombre"
                readOnly
                tabIndex={-1} />
            {
                editNameMode ?
                    <Input
                        style={{ width: 'calc(100% - 80px - 40px)' }}
                        value={searchValue}
                        autoFocus
                        onBlur={handleOnEditTaskName}
                        onPressEnter={handleOnEditTaskName}
                        onChange={handleOnChangingTaskName} />
                    :
                    <Select
                        showSearch
                        notFoundContent={notFoundContent()}
                        onBlur={handleOnSearchingBlurs}
                        onFocus={handleOnSearchFocus}
                        optionFilterProp="label"
                        placeholder="Seleccione una tarea o escriba un nombre para crear una nueva"
                        value={task?.name || "Escriba un nombre para crear una nueva"}
                        style={{ width: 'calc(100% - 80px - 40px)' }}
                        onSearch={handleOnSearchTask}
                        status={task && task.name.trim() === '' ? 'error' : ''}
                        onChange={handleOnChangeSelect}
                        options={project?.tasks.map(t => ({ label: t.name, value: t.id }))} />
            }
            {
                taskExists
                    ? <Button
                        disabled={searchingMode}
                        onClick={handleOnEnableEditNameMode}
                        style={{ width: '40px', padding: 10, marginLeft: 1 }}>
                        <MdEdit size={40} color="var(--text-secondary)" />
                    </Button>
                    : <Button
                        style={{ width: '40px', padding: 10, marginLeft: 1 }}
                        onClick={handleOnCreateNewTask}>
                        <MdAdd size={40} color="var(--text-secondary)" />
                    </Button>
            }
        </Input.Group>

    );
}

export default TaskNameField;