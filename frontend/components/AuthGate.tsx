'use client';

import { ReactNode } from 'react';
import { useAuth } from 'react-oidc-context';

interface AuthGateProps {
  children: ReactNode;
}

export default function AuthGate({ children }: AuthGateProps) {
  const auth = useAuth();

  if (auth.isLoading) {
    return (
      <div className="d-flex flex-column justify-content-center align-items-center min-vh-100 gap-2">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Carregando...</span>
        </div>
        <p className="text-secondary mb-0">Verificando autenticação...</p>
      </div>
    );
  }

  if (auth.error) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100 p-3">
        <div className="card text-center w-100" style={{ maxWidth: '420px' }}>
          <div className="card-body p-4">
            <i className="bi bi-exclamation-triangle text-warning" style={{ fontSize: '2.5rem' }}></i>
            <h1 className="h5 mt-3 mb-2">Não foi possível autenticar</h1>
            <p className="text-secondary small">{auth.error.message}</p>
            <button
              type="button"
              className="btn btn-outline-primary"
              onClick={() => void auth.signinRedirect()}
            >
              <i className="bi bi-arrow-clockwise me-2"></i>
              Tentar novamente
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!auth.isAuthenticated) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100 p-3">
        <div className="card text-center w-100" style={{ maxWidth: '420px' }}>
          <div className="card-body p-4">
            <i className="bi bi-shield-lock text-primary" style={{ fontSize: '2.5rem' }}></i>
            <h1 className="h5 mt-3 mb-2">
              Auditor<span style={{ color: 'var(--accent)' }}>IA</span>
            </h1>
            <p className="text-secondary small">Faça login para acessar o dashboard.</p>
            <button
              type="button"
              className="btn btn-primary w-100"
              onClick={() => void auth.signinRedirect()}
            >
              <i className="bi bi-box-arrow-in-right me-2"></i>
              Entrar
            </button>
          </div>
        </div>
      </div>
    );
  }

  const profile = auth.user?.profile;
  const displayName =
    (profile?.preferred_username as string | undefined) ||
    (profile?.name as string | undefined) ||
    (profile?.email as string | undefined) ||
    'usuário';

  return (
    <>
      <div className="d-flex justify-content-end align-items-center gap-2 px-3 py-2 border-bottom">
        <i className="bi bi-person-circle"></i>
        <span className="text-secondary small">{displayName}</span>
        <button
          type="button"
          className="btn btn-sm btn-outline-primary"
          onClick={() => void auth.signoutRedirect()}
        >
          <i className="bi bi-box-arrow-right me-1"></i>
          Sair
        </button>
      </div>
      {children}
    </>
  );
}