import React, { createContext, useState, ReactNode, useCallback } from "react";
import {
  DndContext,
  DragOverlay,
  type DragStartEvent,
  type DragEndEvent,
  type DragCancelEvent,
  type DragOverEvent,
  closestCorners,
  type Modifier,

} from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import TaskCard from "@views/NodeView/nodeTypes/RoutineNode/components/TaskCard";
import styles from "@views/NodeView/style.module.css";

export interface Task {
  id: string;
  content: string;
  color?: string;
}

interface DndState {
  tasks: Record<string, Task[]>;
  setTasks: React.Dispatch<React.SetStateAction<Record<string, Task[]>>>;
  activeTask: Task | null;
  isDragging: boolean;
  scale: number;
  setScale: React.Dispatch<React.SetStateAction<number>>;

}

export const DndStateContext = createContext<DndState>({} as DndState);

interface ProviderProps {
  children: ReactNode;
  initialTasks: Record<string, Task[]>;
  modifiers?: Modifier[];
  overlayModifiers?: Modifier[];
}

export const DndContextProvider = ({
  children,
  initialTasks,
  modifiers = [],
  overlayModifiers = [],
}: ProviderProps) => {
  const [tasks, setTasks] = useState<Record<string, Task[]>>(initialTasks);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [scale, setScale] = useState(1);

  const adjustForScale = useCallback<Modifier>(
    ({ transform }) => ({
      ...transform,
      x: transform.x / scale,
      y: transform.y / scale,
    }),
    [scale]
  );

  const findContainer = (taskId: string): string | null => {
    for (const [container, items] of Object.entries(tasks)) {
      if (items.find((t) => t.id === taskId)) {
        return container;
      }
    }
    return null;
  };

  const handleDragStart = ({ active }: DragStartEvent) => {
    const containerId = findContainer(active.id as string);
    const task = containerId
      ? tasks[containerId].find((t) => t.id === active.id)
      : null;
    setActiveTask(task || null);
    setIsDragging(true);
  };

  const handleDragOver = ({ active, over }: DragOverEvent) => {
    if (!over) return;
    const activeContainer = findContainer(active.id as string);
    const overContainer = findContainer(over.id as string) || over.id;
    if (!activeContainer || !overContainer || activeContainer === overContainer) return;

    setTasks((prev) => {
      const activeIndex = prev[activeContainer].findIndex((t) => t.id === active.id);
      const task = prev[activeContainer][activeIndex];
      const newActive = prev[activeContainer].filter((t) => t.id !== active.id);
      const newOver = [...prev[overContainer], task];
      return { ...prev, [activeContainer]: newActive, [overContainer]: newOver };
    });
  };

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    const containerId = findContainer(active.id as string);
    const overContainerId = over ? findContainer(over.id as string) || over.id : null;
    if (!containerId) {
      setActiveTask(null);
      setIsDragging(false);
      return;
    }

    if (over && containerId === overContainerId) {
      setTasks((prev) => {
        const containerTasks = prev[containerId];
        const oldIndex = containerTasks.findIndex((t) => t.id === active.id);
        const newIndex = containerTasks.findIndex((t) => t.id === over.id);
        if (oldIndex !== newIndex) {
          return {
            ...prev,
            [containerId]: arrayMove(containerTasks, oldIndex, newIndex),
          };
        }
        return prev;
      });
    }
    setActiveTask(null);
    setIsDragging(false);
  };

  const handleDragCancel = (_: DragCancelEvent) => {
    setActiveTask(null);
    setIsDragging(false);
  };

  return (
    <DndStateContext.Provider value={{ tasks, setTasks, activeTask, isDragging, scale, setScale }}>

      <DndContext
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
        collisionDetection={closestCorners}
        modifiers={[adjustForScale, ...modifiers]}>
        {children}
        <DragOverlay adjustScale modifiers={overlayModifiers}>

          {activeTask ? (
            <div className={styles.dragOverlayCard}>
              <TaskCard id={activeTask.id} containerId="" content={activeTask.content} color={activeTask.color} />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </DndStateContext.Provider>
  );
};

export default DndContextProvider;
