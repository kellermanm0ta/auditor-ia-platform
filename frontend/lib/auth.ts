import { UserManager } from 'oidc-client-ts';

const keycloakUrl = process.env.NEXT_PUBLIC_KEYCLOAK_URL;
const keycloakRealm = process.env.NEXT_PUBLIC_KEYCLOAK_REALM;
const keycloakClientId = process.env.NEXT_PUBLIC_KEYCLOAK_CLIENT_ID;

/**
 * Keycloak realm authority (`<url>/realms/<realm>`).
 * These NEXT_PUBLIC_* values are inlined at build time.
 */
export const authority = `${keycloakUrl}/realms/${keycloakRealm}`;

let userManager: UserManager | null = null;

/**
 * Lazily creates (once) and returns the `UserManager` on the client.
 *
 * `UserManager` relies on browser APIs (`window`, Web Storage), so it must
 * never be instantiated during SSR / module evaluation. Returns `null` on the
 * server (or before `window` exists) so callers can guard accordingly.
 */
export function getUserManager(): UserManager | null {
  if (typeof window === 'undefined') return null;

  if (!userManager) {
    userManager = new UserManager({
      authority,
      client_id: keycloakClientId ?? '',
      redirect_uri: window.location.origin,
      post_logout_redirect_uri: window.location.origin,
      scope: 'openid profile email',
      response_type: 'code',
      automaticSilentRenew: true,
    });
  }

  return userManager;
}