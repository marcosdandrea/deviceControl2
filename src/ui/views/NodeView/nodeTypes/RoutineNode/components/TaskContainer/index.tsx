import React, { useEffect, useState } from 'react';

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
    const [isDraggingOver, setIsDraggingOver] = useState(false);

    useEffect(() => {

        console.log(isDraggingOver)
        // If the container is hovered, set a fixed height

        //setTaskContainerHeight('500px');
    }, [isDraggingOver]);


    return (
            <div
                className={style.taskContainer}
                style={{
                    backgroundColor: 'blue'
                }}>
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

            </div>
    );
};

export default TaskContainer;
