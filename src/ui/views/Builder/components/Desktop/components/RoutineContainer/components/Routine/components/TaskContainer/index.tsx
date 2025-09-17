import React, { useContext, useEffect, useState } from "react";
import style from "./style.module.css";
import SortableList from "react-easy-sort";
import { routineContext } from "../..";
import useProject from "@hooks/useProject";
import Text from "@components/Text";
import Task from "../Task";
import { nanoid } from "nanoid";

const TaskContainer = () => {

    const { routineData } = useContext(routineContext);
    const { project } = useProject({ fetchProject: false });
    const [tasks, setTasks] = useState(routineData?.tasks || []);

    useEffect(() => {
        if (!project || !routineData) return;

        let routineTasks = [...(routineData.tasksId?.map((taskId: string) => {
            return project.tasks.find(t => t.id === taskId);
        }) || []), {}].filter(t => t !== undefined);

        // Si la tarea aparece duplicada, modifica su propiedad "name" agregándole el número de repetición entre paréntesis
        const taskCount: Record<string, number> = {};
        routineTasks = routineTasks.map(task => {
            const count = taskCount[task.id] || 0;
            taskCount[task.id] = count + 1;
            return count > 0 ? { ...task, name: `${task.name} (${count + 1})` } : task;
        });

        // If there are tasks in the routine, set them
        if (routineTasks.length > 0) {
            setTasks(routineTasks)
        }

    }, [project, routineData])

    const onSortEnd = (oldIndex: number, newIndex: number) => {
        if (!routineData) return;
        const newTasks = [...tasks];
        const movedItem = newTasks.splice(oldIndex, 1)[0];
        newTasks.splice(newIndex, 0, movedItem);
        setTasks(newTasks);
        routineData.tasksId = newTasks.map(task => task.id).filter(id => id !== undefined);
    }

    return (
        <div className={style.taskContainer}>
            <Text
                color="gray"
                size={12}>
                {`Las siguiente tareas (${tasks?.length - 1 || 0}) correrán en ${routineData.runInSync ? "serie" : "paralelo"}`}
            </Text>
                <div className={style.listContainer} >
                <SortableList
                    dir="vertical"
                    className={style.taskList}
                    allowDrag={routineData.runInSync == true}
                    draggedItemClassName={style.draggedItem}
                    onSortEnd={onSortEnd}>
                    {
                        tasks?.map((task: any) => (
                            <Task
                                key={nanoid(8)}
                                taskData={task} />
                        ))
                    }
                </SortableList>
            </div>
        </div>
    );
}


export default TaskContainer;