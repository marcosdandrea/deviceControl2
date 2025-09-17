import React, { useContext, useEffect, useState } from "react";
import style from "./style.module.css";
import SortableList from "react-easy-sort";
import { routineContext } from "../..";
import useProject from "@hooks/useProject";
import Text from "@components/Text";
import Task from "../Task";
import { nanoid } from "nanoid";
import { TaskInstance } from "@common/types/routine.type";

const TaskContainer = () => {

    const { routineData } = useContext(routineContext);
    const { project } = useProject({ fetchProject: false });
    const [tasks, setTasks] = useState<any[]>(routineData?.tasks || []);

    useEffect(() => {
        if (!project || !routineData) return;

        const routineTasks = (routineData.tasksId as TaskInstance[] | undefined)?.map((taskInstance) => {
            const task = project.tasks.find(t => t.id === taskInstance.taskId);
            if (!task) return null;
            return { ...task, instanceId: taskInstance.id };
        }).filter(task => task !== null) || [];

        const taskCount: Record<string, number> = {};
        const routineTasksWithDisplayName = routineTasks.map(task => {
            const count = taskCount[task.id] || 0;
            taskCount[task.id] = count + 1;
            return count > 0 ? { ...task, name: `${task.name} (${count + 1})` } : task;
        });

        if (routineTasksWithDisplayName.length > 0) {
            setTasks([...routineTasksWithDisplayName, { instanceId: nanoid(8), isPlaceholder: true }])
        } else {
            setTasks([{ instanceId: nanoid(8), isPlaceholder: true }]);
        }

    }, [project, routineData])

    const onSortEnd = (oldIndex: number, newIndex: number) => {
        if (!routineData) return;
        const newTasks = [...tasks];
        const movedItem = newTasks.splice(oldIndex, 1)[0];
        newTasks.splice(newIndex, 0, movedItem);
        setTasks(newTasks);
        const updatedTaskInstances = newTasks
            .filter(task => task && !task.isPlaceholder && task.instanceId)
            .map(task => {
                const existingInstance = (routineData.tasksId as TaskInstance[] | undefined)?.find(instance => instance.id === task.instanceId);
                if (existingInstance)
                    return existingInstance;
                return { id: task.instanceId, taskId: task.id } as TaskInstance;
            });
        routineData.tasksId = updatedTaskInstances;
    }

    return (
        <div className={style.taskContainer}>
            <Text
                color="gray"
                size={12}>
                {`Las siguiente tareas (${Math.max((tasks?.length || 1) - 1, 0)}) correrán en ${routineData.runInSync ? "serie" : "paralelo"}`}
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
                                key={task?.instanceId || task?.id || nanoid(8)}
                                taskData={task} />
                        ))
                    }
                </SortableList>
            </div>
        </div>
    );
}


export default TaskContainer;