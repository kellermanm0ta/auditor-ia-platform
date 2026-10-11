'use client';

import { Handle, Position, type NodeProps } from '@xyflow/react';
import type { Node } from '@xyflow/react';
import { useWorkflowFlow } from './WorkflowFlowContext';

export type WorkflowAgentNode = Node<{ nome: string; stepNumber: number; color: string; agentId: string; isRoot: boolean }, 'workflowAgent'>;

export default function WorkflowAgentNode({ data }: NodeProps<WorkflowAgentNode>) {
  const { onEditAgent, onDeleteAgent, onAddChildAgent } = useWorkflowFlow();

  return (
    <>
      <Handle type="target" position={Position.Top} />
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '6px 10px',
          borderRadius: '8px',
          border: `1px solid ${data.color}`,
          background: 'var(--bg-elevated, #0f0f1a)',
          minWidth: '220px',
          height: '40px',
        }}
      >
        <i
          className="bi bi-grip-vertical"
          style={{ color: 'var(--text-secondary, #8b8ba7)', cursor: 'grab', fontSize: '14px' }}
        ></i>

        <span
          style={{
            width: '24px',
            height: '24px',
            background: data.color,
            color: '#fff',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '10px',
            fontWeight: 700,
            flexShrink: 0,
          }}
        >
          {data.stepNumber}
        </span>

        <span
          style={{
            fontSize: '12px',
            fontWeight: 600,
            color: 'var(--text-primary, #fff)',
            whiteSpace: 'nowrap',
            flex: 1,
            minWidth: 0,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {data.nome}
        </span>

        <div className="nodrag" style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
          <button
            className="btn btn-sm p-0"
            style={{ color: 'var(--accent, #6c5ce7)', fontSize: '14px', lineHeight: 1 }}
            onClick={() => onAddChildAgent(data.agentId)}
            title="Adicionar Agente"
          >
            <i className="bi bi-plus-circle"></i>
          </button>
          <button
            className="btn btn-sm p-0"
            style={{ color: 'var(--text-secondary, #8b8ba7)', fontSize: '13px', lineHeight: 1 }}
            onClick={() => onEditAgent(data.agentId)}
            title="Editar"
          >
            <i className="bi bi-pencil"></i>
          </button>
          {!data.isRoot && (
            <button
              className="btn btn-sm p-0"
              style={{ color: '#ff4757', fontSize: '13px', lineHeight: 1 }}
              onClick={() => onDeleteAgent(data.agentId)}
              title="Excluir"
            >
              <i className="bi bi-trash"></i>
            </button>
          )}
        </div>
      </div>
      <Handle type="source" position={Position.Bottom} />
    </>
  );
}