'use client';

import AsyncWrapper from './shared/AsyncWrapper';
import Toast from './shared/Toast';
import ConfigModoExecucao from './config/ConfigModoExecucao';
import ConfigFormatoSaida from './config/ConfigFormatoSaida';
import ConfigSkillsPadrao from './config/ConfigSkillsPadrao';
import { useOutputFormats } from '@/hooks/useOutputFormats';
import { useSkills } from '@/hooks/useSkills';
import { useConfig } from '@/hooks/useConfig';

export default function ConfigTab() {
  const { data: outputFormats, error: outputError, isLoading: outputLoading } = useOutputFormats();
  const { data: skills, error: skillsError, isLoading: skillsLoading } = useSkills();
  const {
    data: config,
    error: configError,
    isLoading: configLoading,
    setExecutionMode,
    setOutputFormat,
    setSkillEnabled,
    toast,
    setToast,
  } = useConfig();

  const isLoading = outputLoading || skillsLoading || configLoading;
  const error = outputError?.message ?? skillsError?.message ?? configError?.message ?? null;

  return (
    <div className="tab-pane fade show active" role="tabpanel">
      <Toast
        show={toast}
        message="Configuração atualizada com sucesso!"
        onClose={() => setToast(false)}
      />
      <h4 className="mb-1 fw-bold"><i className="bi bi-sliders"></i>&nbsp; Configurações</h4>
      <p className="text-secondary mb-4" style={{ fontSize: '14px' }}>
        Ajuste o comportamento geral da plataforma.
      </p>

      <AsyncWrapper
        loading={isLoading}
        error={error}
        loadingMessage="Carregando configurações..."
      >
        <ConfigModoExecucao
          executionMode={config?.executionMode}
          onExecutionMode={setExecutionMode}
        />
        <ConfigFormatoSaida
          outputFormats={outputFormats}
          outputFormatId={config?.outputFormatId}
          onOutputFormat={setOutputFormat}
        />
        <ConfigSkillsPadrao
          skills={skills}
          skillIds={config?.skillIds}
          onSkillToggle={setSkillEnabled}
        />
      </AsyncWrapper>
    </div>
  );
}
