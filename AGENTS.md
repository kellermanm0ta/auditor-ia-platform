# AuditorIA — guia do monorepo (agentes)

Este repositório é um **monorepo** com três projetos irmãos. Cada um tem o seu próprio
`AGENTS.md` com detalhes de stack, comandos e armadilhas — **leia o do projeto antes de atuar nele**.

| Diretório | Projeto | AGENTS.md | Especialista (`.opencode/agent`) |
|---|---|---|---|
| `backend/`  | API FastAPI + SQLAlchemy + PostgreSQL | [`backend/AGENTS.md`](./backend/AGENTS.md) | `backend-agent` |
| `frontend/` | Dashboard Next.js 16 + React 19 + Bootstrap | [`frontend/AGENTS.md`](./frontend/AGENTS.md) | `frontend-agent` |
| `infra/`    | Docker Compose + Nginx + Keycloak | [`infra/AGENTS.md`](./infra/AGENTS.md) | `infra-agent` |

## Regras de atuação

- **Não atravesse limites de projeto.** Ao precisar de algo de outro projeto, delegue via `task`
  ao especialista correspondente (ver `orquestrador-dev`). Ex.: UI→`frontend-agent`,
  contrato/endpoint→`backend-agent`, env/porta/compose→`infra-agent`.
- Para mudanças que cruzam projetos, coordene dependências (ex.: o front consome a API; ambos
  dependem do Keycloak do `infra/`).
- Preserve o idioma, o estilo e a estrutura de cada subprojeto.

## Dependências entre projetos

- `infra/` **orquestra** `../backend` e `../frontend` (builda suas imagens e conecta na rede).
- `frontend/` consome a API do `backend/` via `/api/*`.
- `backend/` e `frontend/` dependem do **Keycloak** (IdP) fornecido pelo `infra/`.

## Contrato compartilhado (Keycloak / OIDC)

- Fluxo do frontend: **Authorization Code + PKCE (S256)**; o backend apenas **valida** o access token (RS256).
- `issuer` público vs **JWKS interno**: o `iss` é validado contra o host público
  (`KEYCLOAK_HOSTNAME` → `KEYCLOAK_ISSUER`), mas as chaves são buscadas no endereço interno
  (`KEYCLOAK_URL` → `KEYCLOAK_JWKS_URL`). Mude o host público em **um lugar só**.
- No full stack o browser fala com o Keycloak via nginx em HTTPS (`https://<host>/realms/...`);
  o Keycloak **não** é exposto publicamente. No dev sem nginx (Modo 1) o issuer é forçado para
  `http://localhost:8080`.
- `audience`: `auditoria-backend` · `client id`: `auditoria-frontend`.
- Todas as rotas `/api/*` exigem Bearer token; **`/health` é público**.

## Portas

| Serviço | Porta |
|---|---|
| postgres | 5432 (bind `127.0.0.1`) |
| keycloak | 8080 (bind `127.0.0.1`; no full stack só admin/túnel — o browser usa o nginx; no Modo 1 o browser acessa direto) |
| backend (uvicorn) | 8000 |
| frontend (next dev) | 3000 |
| nginx (stack completa) | 80 (301 → 443) e 443 (TLS) |

## Fluxo de dev (topo)

```bash
# IdP + banco (obrigatório: sem Keycloak o front não autentica e /api/* responde 401)
# Modo 1 (backend/frontend fora do Docker, sem nginx): força o issuer HTTP direto do Keycloak.
cd infra && KEYCLOAK_HOSTNAME=http://localhost:8080 docker compose up -d postgres keycloak

# API e web app rodam fora do Docker, com hot-reload
cd ../backend  && uvicorn app.main:app --reload     # :8000
cd ../frontend && npm run dev                        # :3000 (proxy /api -> :8000)
```

> Sem o override, o `infra/.env` usa `https://localhost` (nginx TLS) e o backend/frontend locais
> (que esperam `http://localhost:8080`) passam a rejeitar os tokens. No full stack, use
> `cd infra && docker compose up -d` e acesse `https://localhost`.

## Documentação

- **Fonte de verdade factual** (serviços, portas, `container_name`, rotas do nginx, variáveis de
  ambiente): [`infra/README.md`](./infra/README.md) — em divergência factual, ele prevalece.
- **Regras operacionais/armadilhas**: o `AGENTS.md` de cada projeto prevalece.
- Após mudanças relevantes, sincronize a documentação com o comando
  [`.opencode/command/sync-docs.md`](./.opencode/command/sync-docs.md).

## Convenções transversais

- **Nunca commitar** `.env`/`.env.local`/segredos — versione apenas os `.env.example`.
- IDs são **`string`** geradas pelo banco (hash `md5` de sequence); **omita o `id`** no body de criação.
- Payloads da API em **camelCase**.
- Não altere a implementação funcional de um projeto para "adequá-la" à documentação.
