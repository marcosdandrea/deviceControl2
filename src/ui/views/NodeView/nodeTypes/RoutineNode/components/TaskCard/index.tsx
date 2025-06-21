import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useViewport } from '@xyflow/react';
import style from './style.module.css';

interface TaskCardProps {
  id: string;
  containerId: string;
  content: string;
}

const TaskCard: React.FC<TaskCardProps> = ({ id, containerId, content }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, data: { containerId } });
  const { zoom } = useViewport();

  const styleItem: React.CSSProperties = {
    transform: CSS.Transform.toString({
      ...transform,
      x: transform ? transform.x / zoom : 0,
      y: transform ? transform.y / zoom : 0,
    }),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      className={
        isDragging ? `${style.card} ${style.dragging}` : style.card
      }
      style={styleItem}
      {...attributes}
      {...listeners}
    >
      {content}
    </div>
  );
};

export default TaskCard;
