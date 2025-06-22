import React, { useCallback, useState } from 'react';
import style from './style.module.css';
import {
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  Background,
  Controls,
  ReactFlow,
  ReactFlowProvider,
  useViewport,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import RoutineNode from './nodeTypes/RoutineNode';
import { DndContext, type Modifier } from '@dnd-kit/core';
import { DndContextProvider } from '@contexts/dndContextProvider/indext';

const nodeTypes = {
  routineNode: RoutineNode,
};

const initialNodes = [
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

const initialTasks: Record<string, { id: string; content: string; color: string }[]> = {
  '3': [
    { id: 't1', content: 'Task 1', color: "blue" },
    { id: 't2', content: 'Task 2', color: "red" },
    { id: 't3', content: 'Task 3', color: "green" },
    { id: 't4', content: 'Task 4', color: "yellow" },
  ],
  '4': [
    { id: 't5', content: 'Task 5', color: "purple" },
    { id: 't6', content: 'Task 6', color: "orange" },

  ],
};

const initialEdges = [

];

const NodeViewInner = () => {

  const { zoom } = useViewport();

  const adjustForZoom = useCallback<Modifier>(
    ({ transform }) => ({
      ...transform,
      x: transform.x / zoom,
      y: transform.y / zoom,
    }),
    [zoom]
  );

  const adjustForZoomOverlay = useCallback<Modifier>(
    ({ transform }) => {
      return {
        ...transform,
        x: transform.x * zoom,
        y: transform.y * zoom,
      };
    }, [zoom]
  );

  const [nodes, setNodes] = useState(initialNodes);
  const [edges, setEdges] = useState(initialEdges);
  const [tasks, setTasks] = useState<Record<string, { id: string; content: string, color: string }[]>>(initialTasks);



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



  return (
    <div className={style.nodeView}>
        <ReactFlow
          panOnDrag={true}
          nodesDraggable={true}
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
          fitView>
          <Background />
          <Controls />
        </ReactFlow>
    </div>
  );
}

const NodeView = () => (
  <ReactFlowProvider>
    <NodeViewInner />
  </ReactFlowProvider>
);

export default NodeView;