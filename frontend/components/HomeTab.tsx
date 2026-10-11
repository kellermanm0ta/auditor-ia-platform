'use client';

import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export default function HomeTab() {
  const [loading, setLoading] = useState(false);
  const [showResult, setShowResult] = useState(true);
  const [mockAnalysis, setMockAnalysis] = useState('');

  useEffect(() => {
    fetch('/analysis.md')
      .then((r) => r.text())
      .then(setMockAnalysis);
  }, []);

  const handleAnalyze = () => {
    setLoading(true);
    setShowResult(false);

    setTimeout(() => {
      setLoading(false);
      setShowResult(true);
    }, 2500);
  };

  return (
    <div className="tab-pane fade show active" role="tabpanel">
      <h4 className="mb-1 fw-bold"><i className="bi bi-house"></i>&nbsp; Analisar Repositório</h4>
      <p className="text-secondary mb-4" style={{ fontSize: '14px' }}>
        Insira o link do repositório para iniciar uma análise automatizada com agentes de IA.
      </p>

      <div className="card mb-4">
        <div className="card-body">
          <div className="input-group">
            <span className="input-group-text" style={{ borderRight: 0 }}>
              <i className="bi bi-link-45deg"></i>
            </span>
            <input
              type="text"
              className="form-control"
              defaultValue="https://github.com/exemplo/meu-projeto"
              placeholder="https://github.com/usuario/repositorio"
              style={{ borderLeft: 0 }}
            />
            <button className="btn btn-primary px-4" onClick={handleAnalyze} disabled={loading}>
              {loading ? (
                <><span className="spinner-border spinner-border-sm me-1"></span> Analisando...</>
              ) : (
                <><i className="bi bi-play-fill me-1"></i> Analisar</>
              )}
            </button>
          </div>
        </div>
      </div>

      {loading && (
        <div>
          <p className="text-secondary mb-2" style={{ fontSize: '13px' }}>
            <i className="bi bi-robot me-1"></i> Agentes em execução...
          </p>
          <div className="card mb-3">
            <div className="card-body">
              <div className="placeholder-glow d-flex align-items-center gap-2 mb-2">
                <span className="placeholder col-1 rounded-pill" style={{ height: '6px' }}></span>
                <span className="placeholder col-3 rounded-pill" style={{ height: '6px' }}></span>
              </div>
              <div className="placeholder-glow">
                <span className="placeholder col-12 rounded mb-1" style={{ height: '10px' }}></span>
                <span className="placeholder col-8 rounded mb-1" style={{ height: '10px' }}></span>
                <span className="placeholder col-10 rounded mb-1" style={{ height: '10px' }}></span>
                <span className="placeholder col-6 rounded" style={{ height: '10px' }}></span>
              </div>
            </div>
          </div>
        </div>
      )}

      {showResult && !loading && (
        <div>
          <div className="d-flex align-items-center justify-content-between mb-2">
            <h6 className="fw-semibold mb-0"><i className="bi bi-file-text me-1"></i> Resultado da Análise</h6>
            <span className="badge badge-agent">
              <i className="bi bi-check-circle text-success me-1"></i> 4 agentes concluídos
            </span>
          </div>
          <div className="markdown-output">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{mockAnalysis}</ReactMarkdown>
          </div>
        </div>
      )}
    </div>
  );
}
