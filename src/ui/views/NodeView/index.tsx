import React, { useCallback, useState } from 'react';
import style from './style.module.css';
import { addEdge, applyEdgeChanges, applyNodeChanges, Background, Controls, ReactFlow } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import RoutineNode from './nodeTypes/RoutineNode';

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

const initialEdges = [

    ];

const NodeView = () => {

  const [nodes, setNodes] = useState(initialNodes);
  const [edges, setEdges] = useState(initialEdges);

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
        panOnDrag={false}
        nodesDraggable={false}
        colorMode='dark'
        nodes={nodes}
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

export default NodeView;