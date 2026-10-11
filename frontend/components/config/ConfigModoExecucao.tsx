'use client';

import { ExecutionMode } from '@/lib/types';

interface ConfigModoExecucaoProps {
  executionMode: ExecutionMode | undefined;
  onExecutionMode: (mode: ExecutionMode) => void;
}

export default function ConfigModoExecucao({ executionMode, onExecutionMode }: ConfigModoExecucaoProps) {
  return (
    <div className="card mb-3">
      <div className="card-header">Execução dos Agentes</div>
      <div className="card-body">
        <div className="d-flex align-items-center justify-content-between">
          <div>
            <div className="fw-semibold">Modo de Execução</div>
            <div className="text-secondary" style={{ fontSize: '13px' }}>
              Agentes rodam em paralelo ou em série?
            </div>
          </div>
          <div className="d-flex gap-2">
            <input
              type="radio"
              className="btn-check"
              name="execMode"
              id="modeParallel"
              value="parallel"
              checked={executionMode === ExecutionMode.PARALELO}
              onChange={() => onExecutionMode(ExecutionMode.PARALELO)}
            />
            <label className="btn btn-outline-primary btn-sm" htmlFor="modeParallel">
              <i className="bi bi-arrow-up-right"></i> Paralelo
            </label>
            <input
              type="radio"
              className="btn-check"
              name="execMode"
              id="modeSerial"
              value="serial"
              checked={executionMode === ExecutionMode.SERIE}
              onChange={() => onExecutionMode(ExecutionMode.SERIE)}
            />
            <label className="btn btn-outline-primary btn-sm" htmlFor="modeSerial">
              <i className="bi bi-arrow-right"></i> Série
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}