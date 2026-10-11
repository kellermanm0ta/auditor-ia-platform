import { getUserManager } from '@/lib/auth';

const BASE = '/api';

/**
 * Builds the `Authorization: Bearer <access_token>` header from the current
 * OIDC user, when available. Returns an empty object on the server and when
 * there is no authenticated user.
 */
export async function authHeaders(): Promise<HeadersInit> {
  const manager = getUserManager();
  if (!manager) return {};

  try {
    const user = await manager.getUser();
    if (user?.access_token) {
      return { Authorization: `Bearer ${user.access_token}` };
    }
  } catch {
    // Ignore storage/token errors — requests proceed unauthenticated.
  }

  return {};
}

export async function fetcher<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, { headers: await authHeaders() });
  if (!res.ok) throw new Error(`Erro ${res.status}`);
  return res.json();
}

export async function poster<T>(path: string, body: unknown): Promise<T> {
  const headers = new Headers(await authHeaders());
  headers.set('Content-Type', 'application/json');
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Erro ${res.status}`);
  return res.json();
}

export async function deleter<T>(path: string): Promise<T | null> {
  const res = await fetch(`${BASE}${path}`, {
    method: 'DELETE',
    headers: await authHeaders(),
  });
  if (!res.ok) throw new Error(`Erro ${res.status}`);
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

export async function putter<T>(path: string, body: unknown): Promise<T> {
  const headers = new Headers(await authHeaders());
  headers.set('Content-Type', 'application/json');
  const res = await fetch(`${BASE}${path}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Erro ${res.status}`);
  return res.json();
}