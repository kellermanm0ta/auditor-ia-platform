<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# AuditorIA — agent guide

## Commands
- `npm run dev` — start dev server
- **Dev prerequisites**: the IdP must be up (`cd ../infra && docker compose up -d postgres keycloak`) and the backend running on `:8000`. Login redirects to `localhost:8080`; `/api/*` is proxied to `localhost:8000` by the `next.config.ts` rewrite, so **no nginx** is needed in dev.
- `npm run build` — production build (also runs TypeScript check)
- `npm run lint` — ESLint (no type check)
- No tests exist. No test framework is configured.



## Architecture
- **SPA with client-side routing** — `app/[[...slug]]/page.tsx` is the single Next.js entry; it mounts a `react-router-dom` `RouterProvider` built by `createRouter()` in `lib/routes.tsx`. Sidebar links are real URLs (`/`, `/skills`, `/workflow`, `/historico`, `/integracoes`, `/config`) rendered through `<Outlet/>` in `components/shared/AppTemplate.tsx`. There is no `app/page.tsx` and no `activeTab` state.
- **All components are `'use client'`** because every tab has interactivity (toggles, buttons, copy, search).
- **All tab data comes from the backend API** via SWR hooks in `hooks/` (no local `data/` fixtures). `lib/api.ts` wraps `fetch` for `/api/*`; `authHeaders()` injects the OIDC Bearer token.
- **Path alias**: `@/*` maps to project root (e.g. `@/hooks/useSkills`, `@/components/shared/Sidebar`).
- **API proxy** (dev only): `next.config.ts` rewrites `/api/:path*` → `http://localhost:8000/api/:path*` to avoid CORS. In production, Nginx routes `/api/*` to the backend (see `../infra`).

## Authentication (Keycloak / OIDC)
- **Libraries**: `oidc-client-ts` + `react-oidc-context`. Flow: **Authorization Code + PKCE (S256)**, `response_type=code`, scope `openid profile email`, `automaticSilentRenew: true`.
- `lib/auth.ts` — `getUserManager()` lazily creates the `UserManager` on the client only (returns `null` during SSR, since `UserManager` uses `window`/Web Storage). Exports `authority`, built from the `NEXT_PUBLIC_KEYCLOAK_*` envs.
- `app/providers.tsx` (`'use client'`) — `Providers` uses a `useSyncExternalStore`-based `useIsClient()` to show a spinner on the server/first hydrate, then mounts `<AuthProvider userManager={...}>` from `react-oidc-context`, wrapping `<AuthGate>`. It also strips `code`/`state` from the URL via `onSigninCallback`.
- `components/AuthGate.tsx` (`'use client'`) — uses `useAuth()`: spinner while `isLoading`, friendly error card on `auth.error`, a login card (`auth.signinRedirect()`) when unauthenticated, and (when authenticated) a slim top bar with the user name + "Sair" (`auth.signoutRedirect()`), then `children`.
- `app/layout.tsx` wraps `{children}` in `<Providers>`; the layout stays a **Server Component**.
- `lib/api.ts` — `authHeaders()` reads `getUserManager().getUser()` and returns `{ Authorization: 'Bearer <token>' }` when present; it is merged into `fetcher`/`poster`/`putter`/`deleter` (via `new Headers(...)` for the JSON methods).
- **No middleware** (`middleware.ts`/`proxy.ts` is intentionally absent): the OIDC client is browser-only, so auth is handled by `<AuthGate>` at render time.
- **Envs** (`frontend/.env.local`, see `.env.example`): `NEXT_PUBLIC_KEYCLOAK_URL`, `NEXT_PUBLIC_KEYCLOAK_REALM`, `NEXT_PUBLIC_KEYCLOAK_CLIENT_ID`. These are **build-time inlined**, so the `Dockerfile` `build` stage declares matching `ARG` + `ENV` (infra passes them as `build.args`). `redirect_uri`/`post_logout_redirect_uri` = current origin.

## Styling
- **Bootstrap 5.3** via `node_modules` imports in `layout.tsx` (includes dark mode via `data-bs-theme`).
- **Custom CSS** in `app/globals.css` using CSS variables. Light/dark theme toggle changes `data-bs-theme` on `<html>` and CSS variables update accordingly.
- **Bootstrap Icons**: import from `bootstrap-icons/font/bootstrap-icons.css`, use `bi-*` classes.
- **Tailwind v4** is installed (via `@tailwindcss/postcss`) but barely used — the project relies on Bootstrap classes + custom CSS.

## Key gotchas
- **Markdown rendering**: `react-markdown` needs `remark-gfm` plugin to render tables. Configured where markdown is rendered (`HomeTab.tsx`, `SkillModal.tsx`).
- **Icons**: use Bootstrap Icons (`<i className="bi bi-shield-check"></i>`), not emoji or SVG.
- **Theme**: managed by `useLocalStorage<'light' | 'dark'>('theme')` in `components/shared/AppTemplate.tsx`, synced to `<html data-bs-theme="{theme}">`. Add/update CSS variables in `globals.css` under `[data-bs-theme="dark"]` and `[data-bs-theme="light"]`.
- **Input group styling**: `.input-group-text` uses CSS variables (`--bg-elevated`, `--border-color`). Do not inline hardcoded colors.

## Data fetching (`hooks/`)
SWR hooks wrap `lib/api.ts`; tabs consume them directly. Add a hook here + a type in `lib/types.ts` for new resources.

| Hook | Endpoint(s) | Notes |
|---|---|---|
| `useSkills` | `/skills` | list + create/update/delete + optimistic enable toggle |
| `useWorkflowAgents` | `/workflow-agents` | list + create/update/delete (blocks delete when the agent has dependents) |
| `useIntegrations` | `/integrations` | list only (read-only catalog) |
| `useHistory` | `/history` | list only |
| `useOutputFormats` | `/output-formats` | list only |
| `useConfig` | `/config` | fetch + update (singleton) |
| `useLocalStorage` | — | UI state persisted in localStorage (`sidebar-collapsed`, `theme`) |

## Reusable components
- **`AsyncWrapper`** — handles `loading`/`error` states with a spinner or error icon. Used by the data-driven tabs (`SkillsTab`, `WorkflowTab`, `HistoryTab`, `IntegrationsTab`, `ConfigTab`). Props: `loading`, `error`, `loadingMessage?`, `errorMessage?`, `children`.