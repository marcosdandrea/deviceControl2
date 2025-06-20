// components/TaskContainer.tsx
import React, { useState } from 'react';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import style from './style.module.css';

const initialItems = [
  { id: '1', content: 'Card 1' },
  { id: '2', content: 'Card 2' },
  { id: '3', content: 'Card 3' },
];

function SortableItem({ id, content }: { id: string; content: string }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const styleItem = {
    transform: CSS.Transform.toString(transform),
    transition,
    padding: 12,
    background: isDragging ? '#e0f7fa' : '#ffffff',
    border: '1px solid #ccc',
    borderRadius: 4,
    marginBottom: 4,
    boxShadow: isDragging ? '0 2px 8px rgba(0,0,0,0.2)' : 'none',
    cursor: 'grab',
  };

  return (
    <div ref={setNodeRef} style={styleItem} {...attributes} {...listeners}>
      {content}
    </div>
  );
}

const TaskContainer = () => {
  const [items, setItems] = useState(initialItems);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 }, // mejora precisión
    })
  );

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    if (active.id !== over?.id) {
      const oldIndex = items.findIndex((item) => item.id === active.id);
      const newIndex = items.findIndex((item) => item.id === over?.id);
      setItems((items) => arrayMove(items, oldIndex, newIndex));
    }
  };

  return (
    <div
      onPointerDown={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
      onTouchStart={(e) => e.stopPropagation()}
      className={style.taskContainer}>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={items.map((item) => item.id)}
          strategy={verticalListSortingStrategy}
        >
          {items.map((item) => (
            <SortableItem key={item.id} id={item.id} content={item.content} />
          ))}
        </SortableContext>
      </DndContext>
    </div>
  );
};

export default TaskContainer;
