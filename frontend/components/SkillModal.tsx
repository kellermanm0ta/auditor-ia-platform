'use client';

import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Skill, SkillCreateInput, SkillInput } from '@/lib/types';

interface SkillModalProps {
  editingSkill: Skill | null;
  onClose: () => void;
  onSaved: (message: string) => void;
  createSkill: (input: SkillCreateInput) => Promise<Skill>;
  updateSkill: (id: string, input: SkillInput) => Promise<Skill>;
}

type Tab = 'principal' | 'prompt';

export default function SkillModal({ editingSkill, onClose, onSaved, createSkill, updateSkill }: SkillModalProps) {
  const [name, setName] = useState(editingSkill?.name ?? '');
  const [icon, setIcon] = useState(editingSkill?.icon ?? '');
  const [desc, setDesc] = useState(editingSkill?.desc ?? '');
  const [prompt, setPrompt] = useState(editingSkill?.prompt ?? '');
  const [enabled, setEnabled] = useState(editingSkill?.enabled ?? false);
  const [activeTab, setActiveTab] = useState<Tab>('principal');
  const [preview, setPreview] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEditing = editingSkill !== null;

  const principalValid = Boolean(name.trim() && icon.trim() && desc.trim());
  const promptValid = Boolean(prompt.trim());
  const valid = principalValid && promptValid;

  const handleSubmit = async () => {
    if (!valid) return;
    setSubmitting(true);
    setError(null);
    try {
      const input: SkillInput = {
        name: name.trim(),
        icon: icon.trim(),
        desc: desc.trim(),
        prompt: prompt.trim(),
        enabled,
      };
      if (isEditing) {
        await updateSkill(editingSkill!.id, input);
        onSaved('Skill atualizada com sucesso!');
      } else {
        await createSkill(input);
        onSaved('Skill criada com sucesso!');
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao salvar skill');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div className="modal-backdrop fade show" style={{ zIndex: 1050 }}></div>
      <div className="modal fade show d-block" tabIndex={-1} style={{ zIndex: 1055 }}>
        <div className="modal-dialog modal-xl">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">{isEditing ? 'Editar Skill' : 'Nova Skill'}</h5>
              <button type="button" className="btn-close" onClick={onClose}></button>
            </div>
            <div className="modal-body">
              {error && (
                <div className="alert alert-danger py-2" style={{ fontSize: '13px' }}>{error}</div>
              )}

              <ul className="nav nav-tabs mb-3">
                <li className="nav-item">
                  <button
                    type="button"
                    className={`nav-link ${activeTab === 'principal' ? 'active' : ''}`}
                    onClick={() => setActiveTab('principal')}
                  >
                    <i className="bi bi-card-text me-1"></i> Principal
                    {!principalValid && <span className="text-danger ms-1" title="Campos obrigatórios">*</span>}
                  </button>
                </li>
                <li className="nav-item">
                  <button
                    type="button"
                    className={`nav-link ${activeTab === 'prompt' ? 'active' : ''}`}
                    onClick={() => setActiveTab('prompt')}
                  >
                    <i className="bi bi-markdown me-1"></i> Prompt
                    {!promptValid && <span className="text-danger ms-1" title="Prompt obrigatório">*</span>}
                  </button>
                </li>
              </ul>

              {activeTab === 'principal' && (
                <div className="row g-3">
                  <div className="col-md-8">
                    <label className="form-label">Nome</label>
                    <input
                      type="text"
                      className="form-control"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Ex: Análise de Segurança"
                    />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label d-flex align-items-center gap-2">
                      Ícone
                      {icon.trim() && <i className={`bi ${icon.trim()}`} style={{ color: '#6c5ce7' }}></i>}
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      value={icon}
                      onChange={(e) => setIcon(e.target.value)}
                      placeholder="bi-shield-check"
                    />
                  </div>
                  <div className="col-12">
                    <label className="form-label">Descrição</label>
                    <textarea
                      className="form-control"
                      rows={2}
                      value={desc}
                      onChange={(e) => setDesc(e.target.value)}
                      placeholder="Descreva o objetivo desta skill"
                    ></textarea>
                  </div>
                  <div className="col-12">
                    <div className="form-check form-switch">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        role="switch"
                        id="skill-enabled"
                        checked={enabled}
                        onChange={(e) => setEnabled(e.target.checked)}
                      />
                      <label className="form-check-label" htmlFor="skill-enabled">
                        Habilitada por padrão
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'prompt' && (
                <div>
                  <div className="d-flex align-items-center justify-content-between mb-2">
                    <label className="form-label mb-0 d-flex align-items-center gap-2">
                      Prompt <span className="badge badge-agent">Markdown</span>
                    </label>
                    <div className="form-check form-switch mb-0">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        role="switch"
                        id="skill-prompt-preview"
                        checked={preview}
                        onChange={(e) => setPreview(e.target.checked)}
                      />
                      <label className="form-check-label" htmlFor="skill-prompt-preview" style={{ fontSize: '13px' }}>
                        <i className="bi bi-eye me-1"></i> Visualizar Markdown
                      </label>
                    </div>
                  </div>

                  {preview ? (
                    <div className="markdown-output" style={{ minHeight: '55vh', maxHeight: '55vh', overflowY: 'auto' }}>
                      {prompt.trim() ? (
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{prompt}</ReactMarkdown>
                      ) : (
                        <p className="text-secondary mb-0" style={{ fontSize: '13px' }}>
                          Nada para visualizar.
                        </p>
                      )}
                    </div>
                  ) : (
                    <textarea
                      className="form-control"
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      placeholder="# Instruções&#10;&#10;Descreva em Markdown as instruções enviadas ao agente."
                      style={{ minHeight: '55vh', resize: 'vertical', fontFamily: 'monospace', fontSize: '13px' }}
                    ></textarea>
                  )}
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={onClose}>Cancelar</button>
              <button
                className="btn btn-primary"
                onClick={handleSubmit}
                disabled={!valid || submitting}
              >
                {submitting ? (
                  <><span className="spinner-border spinner-border-sm me-1"></span>Salvando...</>
                ) : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}