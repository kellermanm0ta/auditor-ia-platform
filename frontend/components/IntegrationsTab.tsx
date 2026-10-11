'use client';

import { useState, useCallback } from 'react';
import type { Integration } from '@/lib/types';
import AsyncWrapper from './shared/AsyncWrapper';
import { useIntegrations } from '@/hooks/useIntegrations';

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export default function IntegrationsTab() {
  const { data: integrations, error, isLoading } = useIntegrations();
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = useCallback((id: string, code: string) => {
    navigator.clipboard.writeText(code).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  }, []);

  return (
    <div className="tab-pane fade show active" role="tabpanel">
      <h4 className="mb-1 fw-bold"><i className="bi bi-puzzle"></i>&nbsp; Integrações</h4>
      <p className="text-secondary mb-4" style={{ fontSize: '14px' }}>
        Conecte o AuditorIA ao seu pipeline de CI/CD e outras ferramentas do ecossistema de desenvolvimento.
      </p>

      <AsyncWrapper
        loading={isLoading}
        error={error?.message ?? null}
        loadingMessage="Carregando integrações..."
      >
        <div className="row g-3">
          {(integrations ?? []).map((int) => (
            <div className="col-md-6 col-lg-4" key={int.id}>
              <div className="integration-card d-flex flex-column">
                <div className="d-flex align-items-start gap-3 mb-3">
                  <div className="icon-wrap"><i className={`${int.icon}`}></i></div>
                  <div className="flex-grow-1 min-w-0">
                    <div className="d-flex align-items-center gap-2">
                      <h6 className="fw-semibold mb-0">{int.name}</h6>
                      <span className={`integration-status ${int.status === 'connected' ? 'on' : 'off'}`}></span>
                      <span className="text-secondary" style={{ fontSize: '11px' }}>{int.statusLabel}</span>
                    </div>
                    <p className="text-secondary mb-0" style={{ fontSize: '12px', marginTop: '2px' }}>{int.desc}</p>
                  </div>
                </div>

                <div style={{ fontSize: '12px', color: '#b8b8d8', marginBottom: '8px' }}>
                  {int.steps.map((step, i) => (
                    <div className="mb-1" key={i}>
                      <i className="bi bi-arrow-right-short text-primary"></i> {step}
                    </div>
                  ))}
                </div>

                <div className="code-snippet mb-3 flex-grow-1">{escapeHtml(int.yaml)}</div>

                <div className="d-flex gap-2 mt-auto">
                  <button className="copy-btn" onClick={() => handleCopy(int.id, int.yaml)}>
                    {copiedId === int.id ? (
                      <><i className="bi bi-check-lg me-1"></i>Copiado!</>
                    ) : (
                      <><i className="bi bi-clipboard me-1"></i>Copiar</>
                    )}
                  </button>
                  <button className="copy-btn">
                    <i className="bi bi-box-arrow-up-right me-1"></i>Documentação
                  </button>
                  <button className="btn btn-outline-primary btn-sm ms-auto" style={{ fontSize: '12px' }}>
                    {int.status === 'connected' ? 'Gerenciar' : 'Conectar'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </AsyncWrapper>
    </div>
  );
}
