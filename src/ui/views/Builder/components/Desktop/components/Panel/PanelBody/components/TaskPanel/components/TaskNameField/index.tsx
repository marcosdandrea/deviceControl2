
import React, { useContext, useEffect, useState } from "react";
import { taskContext } from "../..";
import useProject from "@hooks/useProject";
import EditableSelectList from "@views/Builder/components/EditableSelectList";

const TaskNameField = () => {

    const { project } = useProject({ fetchProject: false })
    const { task, setTask, defaultTask } = useContext(taskContext)

    const [taskOptions, setTaskOptions] = useState([])
    const [selectedTask, setSelectedTask] = useState<{ label: string; value: string; } | null>(null)

    useEffect(() => {
        if (project) {
            const options = project.tasks?.map((t: any) => ({ label: t.name, value: t.id }))
            setTaskOptions(options)
        }
    }, [project])

    useEffect(() => {
        if (task) {
            setSelectedTask({ label: task.name, value: task.id })
        }
    }, [task])

    const handleOnCreateTaskOption = (tasks: { label: string; value: string; }[], newTask: { label: string; value: string; }) => {
        setTaskOptions(tasks)
        setSelectedTask(newTask)
        setTask({ ...defaultTask, id: newTask.value, name: newTask.label })
    }

    const handleOnUpdateTaskOption = (tasks: { label: string; value: string; }[], updatedOption: { label: string; value: string; }) => {
        setTaskOptions(tasks)
        setSelectedTask(updatedOption)
        const taskInProject = project.tasks.find(t => t.id === updatedOption.value)
        if (taskInProject) {
            setTask({ ...taskInProject, name: updatedOption.label })
            return
        }
        setTask({ ...defaultTask, id: updatedOption.value, name: updatedOption.label })
    }

    const handleOnSelectTask = (value: string, label: any) => {
        setSelectedTask({ label: label, value: value })
        const selected = project.tasks.find((t: any) => t.id === value)
        if (selected) {
            setTask(selected)
        } else {
            setTask({ ...defaultTask, id: value, name: label })
        }
    }

    return (
        <EditableSelectList
            label="Nombre"
            options={taskOptions}
            value={selectedTask}
            createNewOptionLabel="Crear Nueva Tarea"
            onCreateOption={handleOnCreateTaskOption}
            onUpdateOption={handleOnUpdateTaskOption}
            onSelectOption={handleOnSelectTask}
            />
    );
}

export default TaskNameField;
