'use client';

import type { OutputFormat } from '@/lib/types';

interface ConfigFormatoSaidaProps {
  outputFormats: OutputFormat[] | undefined;
  outputFormatId: string | undefined;
  onOutputFormat: (id: string) => void;
}

export default function ConfigFormatoSaida({
  outputFormats,
  outputFormatId,
  onOutputFormat,
}: ConfigFormatoSaidaProps) {
  return (
    <div className="card mb-3">
      <div className="card-header">Formato de Saída</div>
      <div className="card-body">
        <div className="d-flex align-items-center justify-content-between">
          <div>
            <div className="fw-semibold">Formato padrão do relatório</div>
            <div className="text-secondary" style={{ fontSize: '13px' }}>
              Como o resultado da análise deve ser apresentado.
            </div>
          </div>
          <select
            className="form-select form-select-sm w-auto"
            id="outputFormat"
            value={outputFormatId ?? ''}
            onChange={(e) => onOutputFormat(e.target.value)}
          >
            {(outputFormats ?? []).map((fmt) => (
              <option key={fmt.value} value={fmt.id}>{fmt.label}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}