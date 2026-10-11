'use client';

import { useState, useCallback } from 'react';
import { ReactFlowProvider } from '@xyflow/react';
import type { WorkflowAgent } from '@/lib/types';
import AsyncWrapper from '../shared/AsyncWrapper';
import ConfirmModal from '../shared/ConfirmModal';
import { useWorkflowAgents } from '@/hooks/useWorkflowAgents';
import WorkflowFlow from './WorkflowFlow';
import AgentModal from './AgentModal';

export default function WorkflowTab() {
  const { data: agents, error, isLoading, createAgent, updateAgent, deleteAgent } = useWorkflowAgents();
  const [showModal, setShowModal] = useState(false);
  const [editingAgent, setEditingAgent] = useState<WorkflowAgent | null>(null);
  const [parentAgentId, setParentAgentId] = useState<string | null>(null);
  const [deletingAgent, setDeletingAgent] = useState<WorkflowAgent | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handleAddChildAgent = useCallback((agentId: string) => {
    setEditingAgent(null);
    setParentAgentId(agentId);
    setShowModal(true);
  }, []);

  const handleEditAgent = useCallback((agentId: string) => {
    const agent = (agents ?? []).find((a) => a.id === agentId);
    if (agent) {
      setEditingAgent(agent);
      setParentAgentId(null);
      setShowModal(true);
    }
  }, [agents]);

  const handleDeleteAgent = useCallback((agentId: string) => {
    const agent = (agents ?? []).find((a) => a.id === agentId);
    if (agent) {
      setDeletingAgent(agent);
      setDeleteError(null);
    }
  }, [agents]);

  const confirmDelete = useCallback(async () => {
    if (!deletingAgent) return;
    try {
      await deleteAgent(deletingAgent.id);
      setDeletingAgent(null);
    } catch (e) {
      setDeleteError(e instanceof Error ? e.message : 'Erro ao excluir agente');
    }
  }, [deletingAgent, deleteAgent]);

  const handleClose = useCallback(() => {
    setShowModal(false);
    setEditingAgent(null);
    setParentAgentId(null);
  }, []);

  const handleSaved = useCallback(() => {
    setShowModal(false);
    setEditingAgent(null);
    setParentAgentId(null);
  }, []);

  return (
    <div className="tab-pane fade show active" role="tabpanel">
      <h4 className="mb-1 fw-bold"><i className="bi bi-diagram-3"></i>&nbsp; Orquestração de Agentes</h4>
      <p className="text-secondary mb-4" style={{ fontSize: '14px' }}>
        Defina a ordem de execução dos agentes e como eles se encadeiam.
      </p>

      <div className="card">
        <div className="card-header d-flex align-items-center justify-content-between">
          <span>Pipeline Atual</span>
          <button className="btn btn-outline-primary btn-sm" onClick={() => { setEditingAgent(null); setParentAgentId(null); setShowModal(true); }}>
            <i className="bi bi-plus-lg"></i> Adicionar Agente
          </button>
        </div>
        <div className="card-body" style={{ height: '500px', padding: 0 }}>
          <AsyncWrapper
            loading={isLoading}
            error={error?.message ?? null}
            loadingMessage="Carregando agentes..."
          >
            <ReactFlowProvider>
              <WorkflowFlow agents={agents ?? []} onEditAgent={handleEditAgent} onDeleteAgent={handleDeleteAgent} onAddChildAgent={handleAddChildAgent} />
            </ReactFlowProvider>
          </AsyncWrapper>
        </div>
      </div>

      <AgentModal
        show={showModal}
        agents={agents ?? []}
        editingAgent={editingAgent}
        parentAgentId={parentAgentId}
        onClose={handleClose}
        onSaved={handleSaved}
        createAgent={createAgent}
        updateAgent={updateAgent}
      />

      <ConfirmModal
        show={deletingAgent !== null}
        title="Excluir Agente"
        message={
          deleteError
            ? deleteError
            : `Deseja realmente excluir o agente "${deletingAgent?.nome}"?`
        }
        confirmLabel={deleteError ? 'OK' : 'Excluir'}
        variant={deleteError ? 'primary' : 'danger'}
        onConfirm={deleteError ? () => { setDeletingAgent(null); setDeleteError(null); } : confirmDelete}
        onCancel={() => { setDeletingAgent(null); setDeleteError(null); }}
      />
    </div>
  );
}
