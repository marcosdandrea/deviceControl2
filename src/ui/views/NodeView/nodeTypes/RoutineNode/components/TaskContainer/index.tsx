import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import TaskCard from '../TaskCard';
import style from './style.module.css';

interface Task {
  id: string;
  content: string;
}

interface TaskContainerProps {
  containerId: string;
  tasks: Task[];
}

const TaskContainer: React.FC<TaskContainerProps> = ({ containerId, tasks }) => {
  const { setNodeRef } = useDroppable({ id: containerId });

  return (
    <div
      ref={setNodeRef}
      onPointerDown={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
      onTouchStart={(e) => e.stopPropagation()}
      className={style.taskContainer}
    >
      {tasks.length === 0 && (
        <div className={style.noTasks}>
          <p>No tasks</p>
        </div>
      )}
      <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
        {tasks.map((task) => (
          <TaskCard key={task.id} id={task.id} containerId={containerId} content={task.content} />
        ))}
      </SortableContext>
    </div>
  );
};

export default TaskContainer;
