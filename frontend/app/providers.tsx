'use client';

import { ReactNode, useMemo, useSyncExternalStore } from 'react';
import { AuthProvider } from 'react-oidc-context';
import { getUserManager } from '@/lib/auth';
import AuthGate from '@/components/AuthGate';

interface ProvidersProps {
  children: ReactNode;
}

const emptySubscribe = () => () => {};

/**
 * Returns `false` on the server and during hydration, then `true` on the client.
 * Backed by `useSyncExternalStore` so the first client render matches the
 * server output (no hydration mismatch, no setState inside an effect).
 */
function useIsClient(): boolean {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );
}

/**
 * Client-side providers for the app.
 *
 * The `UserManager` is created lazily on the client only (see `lib/auth.ts`).
 * On the server (and the first hydrated render) we show a spinner; once the
 * client is live we mount `AuthProvider` with the manager.
 */
export default function Providers({ children }: ProvidersProps) {
  const isClient = useIsClient();
  const userManager = useMemo(() => (isClient ? getUserManager() : null), [isClient]);

  if (!userManager) {
    return (
      <div className="d-flex flex-column justify-content-center align-items-center min-vh-100 gap-2">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Carregando...</span>
        </div>
        <p className="text-secondary mb-0">Inicializando autenticação...</p>
      </div>
    );
  }

  return (
    <AuthProvider
      userManager={userManager}
      onSigninCallback={() => {
        window.history.replaceState({}, document.title, window.location.pathname);
      }}
    >
      <AuthGate>{children}</AuthGate>
    </AuthProvider>
  );
}