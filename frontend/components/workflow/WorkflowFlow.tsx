'use client';

import { useMemo, useEffect } from 'react';
import {
  ReactFlow,
  useNodesState,
  useEdgesState,
  useReactFlow,
} from '@xyflow/react';
import type { WorkflowAgent } from '@/lib/types';
import { buildFlow } from '@/lib/workflowLayout';
import WorkflowAgentNode from './WorkflowAgentNode';
import { WorkflowFlowProvider } from './WorkflowFlowContext';

const nodeTypes = { workflowAgent: WorkflowAgentNode };

interface FlowProps {
  agents: WorkflowAgent[];
  onEditAgent: (id: string) => void;
  onDeleteAgent: (id: string) => void;
  onAddChildAgent: (id: string) => void;
}

export default function WorkflowFlow({ agents, onEditAgent, onDeleteAgent, onAddChildAgent }: FlowProps) {
  const { nodes: initialNodes, edges: initialEdges } = useMemo(
    () => buildFlow(agents),
    [agents],
  );
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const { fitView } = useReactFlow();

  useEffect(() => {
    setNodes(initialNodes);
    setEdges(initialEdges);
  }, [setNodes, setEdges, initialNodes, initialEdges]);

  useEffect(() => {
    requestAnimationFrame(() => fitView({ padding: 0.2, duration: 300 }));
  }, [initialNodes, fitView]);

  return (
    <WorkflowFlowProvider onEditAgent={onEditAgent} onDeleteAgent={onDeleteAgent} onAddChildAgent={onAddChildAgent}>
      <div style={{ width: '100%', height: 500 }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={nodeTypes}
          fitView
          proOptions={{ hideAttribution: true }}
          minZoom={0.3}
          maxZoom={2}
          defaultEdgeOptions={{
            type: 'smoothstep',
            animated: true,
            style: { stroke: '#6c5ce7' },
          }}
        />
      </div>
    </WorkflowFlowProvider>
  );
}