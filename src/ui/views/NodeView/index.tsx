import React, { useCallback, useState } from 'react';
import style from './style.module.css';
import {
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  Background,
  Controls,
  ReactFlow,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import RoutineNode from './nodeTypes/RoutineNode';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
} from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';

const nodeTypes = {
  routineNode: RoutineNode,
};

const initialNodes = [
  {
    id: '1',
    data: { label: 'Hello' },
    position: { x: 0, y: 0 },
    type: 'input',
  },
  {
    id: '2',
    data: { label: 'World' },
    position: { x: 100, y: 100 },
  },
  {
    id: '3',
    data: { label: 'Campaing Node', color: '#00ff00', onChange: (e) => console.log('Color changed:', e.target.value) },
    position: { x: 200, y: 200 },
    type: 'routineNode',
  },
    {
    id: '4',
    data: { label: 'Campaing Node', color: '#00ff00', onChange: (e) => console.log('Color changed:', e.target.value) },
    position: { x: 400, y: 200 },
    type: 'routineNode',
  },
];

const initialTasks: Record<string, { id: string; content: string }[]> = {
  '3': [
    { id: 't1', content: 'Task 1' },
    { id: 't2', content: 'Task 2' },
  ],
  '4': [
    { id: 't3', content: 'Task 3' },
  ],
};

const initialEdges = [

    ];

const NodeView = () => {

  const [nodes, setNodes] = useState(initialNodes);
  const [edges, setEdges] = useState(initialEdges);
  const [tasks, setTasks] = useState<Record<string, { id: string; content: string }[]>>(initialTasks);
  const [activeTask, setActiveTask] = useState<{ id: string; content: string; containerId: string } | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const handleDragStart = useCallback(
    ({ active }) => {
      const containerId = active.data.current?.containerId;
      if (!containerId) return;
      const item = tasks[containerId]?.find((t) => t.id === active.id);
      if (item) {
        setActiveTask({ ...item, containerId });
      }
    },
    [tasks]
  );

  const onNodesChange = useCallback(
    (changes) => setNodes((nds) => applyNodeChanges(changes, nds)),
    [],
  );
  const onEdgesChange = useCallback(
    (changes) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    [],
  )

  const onConnect = useCallback(
    (params) => {
      console.log('onConnect', params);

      setEdges((eds) => addEdge(params, eds))
    },
    [],
  );

  const handleDragEnd = useCallback(
    ({ active, over }) => {
      setActiveTask(null);
      if (!over) return;
      const activeContainer = active.data.current?.containerId;
      const overContainer = over.data.current?.containerId;
      if (!activeContainer || !overContainer) return;

      setTasks((prev) => {
        const activeIndex = prev[activeContainer].findIndex((t) => t.id === active.id);
        const item = prev[activeContainer][activeIndex];
        if (activeContainer === overContainer) {
          const overIndex = prev[overContainer].findIndex((t) => t.id === over.id);
          return {
            ...prev,
            [activeContainer]: arrayMove(prev[activeContainer], activeIndex, overIndex),
          };
        }
        const newActive = [...prev[activeContainer]];
        newActive.splice(activeIndex, 1);
        const overIndex = prev[overContainer].findIndex((t) => t.id === over.id);
        const newOver = [...prev[overContainer]];
        if (overIndex === -1) {
          newOver.push(item);
        } else {
          newOver.splice(overIndex, 0, item);
        }
        return {
          ...prev,
          [activeContainer]: newActive,
          [overContainer]: newOver,
        };
      });
    },
    []
  );


  return (
    <div className={style.nodeView}>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <ReactFlow
          panOnDrag={false}
          nodesDraggable={false}
          colorMode='dark'
          nodes={nodes.map((n) =>
            n.type === 'routineNode'
              ? { ...n, data: { ...n.data, tasks: tasks[n.id] || [] } }
              : n
          )}
          nodeTypes={nodeTypes}
          onNodesChange={onNodesChange}
          edges={edges}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          fitView
        >
          <Background />
          <Controls />
        </ReactFlow>
        <DragOverlay>
          {activeTask && (
            <div className={style.dragOverlayCard}>{activeTask.content}</div>
          )}
        </DragOverlay>
      </DndContext>
    </div>
  );
}

export default NodeView;