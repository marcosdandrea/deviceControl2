import React, { useEffect } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import TaskCard from '../TaskCard';
import style from './style.module.css';

interface Task {
    id: string;
    content: string;
    color?: string;
}

interface TaskContainerProps {
    containerId: string;
    tasks: Task[];
}

const TaskContainer: React.FC<TaskContainerProps> = ({ containerId, tasks }) => {
    const { setNodeRef, isOver } = useDroppable({ id: containerId });

    useEffect(() => {
        // Could be used for styling when hovering
    }, [isOver]);

    return (
            <div
                ref={setNodeRef}
                className={style.taskContainer}
                style={{
                    backgroundColor: 'blue'
                }}>
                <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
                {
                    tasks.length === 0
                        ? <div className={style.noTasks}>
                            <p>No tasks</p>
                        </div>
                        : tasks.map((task) =>
                            <TaskCard
                                key={task.id}
                                id={task.id}
                                containerId={containerId}
                                content={task.content}
                                color={task.color} />)
                }
                </SortableContext>

            </div>
    );
};

export default TaskContainer;
