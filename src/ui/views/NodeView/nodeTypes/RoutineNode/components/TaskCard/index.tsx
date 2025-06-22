import React, { useContext } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { DndStateContext } from '@contexts/dndContextProvider/indext';

import style from './style.module.css';

interface TaskCardProps {
  id: string;
  containerId: string;
  content: string;
  color?: string;
}

const TaskCard: React.FC<TaskCardProps> = ({ id, containerId, content, color }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, data: { containerId } });
  const { scale } = useContext(DndStateContext);

  const styleCard: React.CSSProperties = {
    transform: transform
      ? CSS.Transform.toString({
          ...transform,
          x: transform.x / scale,
          y: transform.y / scale,
        })
      : undefined,

    transition,
    backgroundColor: color,
  };

  return (
    <div
      ref={setNodeRef}
      className={`${style.card} ${isDragging ? style.dragging : ''}`}
      style={styleCard}
      {...attributes}
      {...listeners}
    >
      {content}
    </div>
  );
};

export default TaskCard;
