'use client';

import { useState, useEffect } from 'react';
import type { WorkflowAgent } from '@/lib/types';

interface AgentModalProps {
  show: boolean;
  agents: WorkflowAgent[];
  editingAgent: WorkflowAgent | null;
  parentAgentId?: string | null;
  onClose: () => void;
  onSaved: () => void;
  createAgent: (nome: string, dependeDe: string | null) => Promise<WorkflowAgent>;
  updateAgent: (id: string, nome: string, dependeDe: string | null) => Promise<WorkflowAgent>;
}

export default function AgentModal({ show, agents, editingAgent, parentAgentId, onClose, onSaved, createAgent, updateAgent }: AgentModalProps) {
  const [nome, setNome] = useState('');
  const [dependeDe, setDependeDe] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEditing = editingAgent !== null;

  useEffect(() => {
    if (show) {
      setNome(editingAgent?.nome ?? '');
      setDependeDe(editingAgent?.dependeDe ?? parentAgentId ?? '');
      setError(null);
    }
  }, [show, editingAgent, parentAgentId]);

  if (!show) return null;

  const handleSubmit = async () => {
    if (!nome.trim()) return;
    if (!isEditing && !dependeDe) return;
    setSubmitting(true);
    setError(null);
    try {
      if (isEditing) {
        await updateAgent(editingAgent!.id, nome.trim(), dependeDe || null);
      } else {
        await createAgent(nome.trim(), dependeDe);
      }
      onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao salvar agente');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    onClose();
  };

  const availableParents = isEditing
    ? agents.filter((a) => a.id !== editingAgent!.id)
    : agents;

  return (
    <>
      <div className="modal-backdrop fade show" style={{ zIndex: 1050 }}></div>
      <div className="modal fade show d-block" tabIndex={-1} style={{ zIndex: 1055 }}>
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">{isEditing ? 'Editar Agente' : 'Adicionar Agente'}</h5>
              <button type="button" className="btn-close" onClick={handleClose}></button>
            </div>
            <div className="modal-body">
              {error && (
                <div className="alert alert-danger py-2" style={{ fontSize: '13px' }}>{error}</div>
              )}
              <div className="mb-3">
                <label className="form-label">Nome do agente</label>
                <input
                  type="text"
                  className="form-control"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Ex: Análise de Segurança"
                />
              </div>
              <div className="mb-3">
                <label className="form-label">
                  Depende de {!isEditing && <span className="text-danger">*</span>}
                </label>
                <select
                  className="form-select"
                  value={dependeDe}
                  onChange={(e) => setDependeDe(e.target.value)}
                >
                  {isEditing && <option value="">Nenhum</option>}
                  {availableParents.map((a) => (
                    <option key={a.id} value={a.id}>{a.nome}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={handleClose}>Cancelar</button>
              <button
                className="btn btn-primary"
                onClick={handleSubmit}
                disabled={!nome.trim() || (!isEditing && !dependeDe) || submitting}
              >
                {submitting ? (
                  <><span className="spinner-border spinner-border-sm me-1"></span>Salvando...</>
                ) : 'OK'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}