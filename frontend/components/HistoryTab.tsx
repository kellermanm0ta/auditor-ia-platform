'use client';

import { useState } from 'react';
import type { HistoryItem } from '@/lib/types';
import AsyncWrapper from './shared/AsyncWrapper';
import { useHistory } from '@/hooks/useHistory';

function severityBadgeClass(severity: string): string {
  if (severity === 'Crítico' || severity === 'Alto') return 'danger';
  if (severity === 'Médio') return 'warning text-dark';
  return 'success';
}

function severityBorderClass(severity: string): string {
  if (severity === 'Crítico' || severity === 'Alto') return 'text-danger border-danger';
  if (severity === 'Médio') return 'text-warning border-warning';
  return 'text-success border-success';
}

export default function HistoryTab() {
  const { data: history, error, isLoading } = useHistory();
  const [search, setSearch] = useState('');

  const filtered = (history ?? []).filter((h: HistoryItem) =>
    h.repo.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="tab-pane fade show active" role="tabpanel">
      <h4 className="mb-1 fw-bold"><i className="bi bi-clock-history"></i>&nbsp; Histórico de Análises</h4>
      <p className="text-secondary mb-4" style={{ fontSize: '14px' }}>
        Visualize análises anteriores realizadas pela plataforma.
      </p>

      <div className="input-group mb-3" style={{ maxWidth: '360px' }}>
        <span className="input-group-text" style={{ borderRight: 0 }}>
          <i className="bi bi-search"></i>
        </span>
        <input
          type="text"
          className="form-control"
          placeholder="Buscar repositório..."
          style={{ borderLeft: 0 }}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <AsyncWrapper
        loading={isLoading}
        error={error?.message ?? null}
        loadingMessage="Carregando histórico..."
      >
        {filtered.map((h) => (
        <div
          className="history-item d-flex align-items-center justify-content-between flex-wrap gap-2"
          key={h.id}
        >
          <div className="d-flex align-items-center gap-3">
            <i className="bi bi-github" style={{ fontSize: '18px', color: '#6c5ce7' }}></i>
            <div>
              <div className="fw-semibold" style={{ fontSize: '14px' }}>{h.repo}</div>
              <div className="text-secondary" style={{ fontSize: '12px' }}>
                <i className="bi bi-calendar3 me-1"></i>{h.date} · {h.time}
              </div>
            </div>
          </div>
          <div className="d-flex align-items-center gap-3">
            <span className="badge badge-agent"><i className="bi bi-robot me-1"></i>{h.agents} agentes</span>
            <span className={`badge bg-${severityBadgeClass(h.severity)}`}>{h.issues} issues</span>
            <span className={`badge bg-opacity-25 border ${severityBorderClass(h.severity)}`}>
              {h.severity}
            </span>
          </div>
        </div>
      ))}
      </AsyncWrapper>
    </div>
  );
}
