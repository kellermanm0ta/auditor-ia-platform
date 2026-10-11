'use client';

import { ReactNode } from 'react';

interface AsyncWrapperProps {
  loading: boolean;
  error: string | null;
  loadingMessage?: string;
  errorMessage?: string;
  children: ReactNode;
}

export default function AsyncWrapper({
  loading,
  error,
  loadingMessage = 'Carregando...',
  errorMessage,
  children,
}: AsyncWrapperProps) {
  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Carregando...</span>
        </div>
        <p className="text-secondary mt-2">{loadingMessage}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-5">
        <i className="bi bi-exclamation-triangle text-warning" style={{ fontSize: '2rem' }}></i>
        <p className="text-danger mt-2">{errorMessage || `Erro ao carregar: ${error}`}</p>
      </div>
    );
  }

  return <>{children}</>;
}