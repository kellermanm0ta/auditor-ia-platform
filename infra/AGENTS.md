# AuditorIA Infra

Orquestração Docker Compose + Nginx do AuditorIA. Não contém código de aplicação —
orquestra os repos irmãos: `../backend` (API FastAPI) e `../frontend` (Next.js).

> **Escopo deste arquivo:** regras de operação e armadilhas para agentes.
> **Fatos do stack** (serviços, portas, `container_name`, rotas do nginx, variáveis de
> ambiente, quickstart) estão no **[`README.md`](./README.md)** — leia-o antes de operar e
> **não duplique tabelas aqui**. Em divergência **factual**, o README prevalece; em **regra
> operacional**, este arquivo prevalece.

## Keycloak (identidade)

- **Realm** `auditoria`, importado de `keycloak/realm-export.json` (bind read-only em
  `/opt/keycloak/data/import`). O `--import-realm` só importa quando o realm **não existe**:
  editar o JSON e reiniciar **não** aplica as mudanças — exige `docker compose down -v` antes.
- **Client público** `auditoria-frontend` (PKCE S256, `standardFlow` + `directAccessGrants`).
  `directAccessGrantsEnabled` está ligado **apenas para permitir smoke-test via password grant**
  — em produção pode ser desligado.
- **Audience** `auditoria-backend` adicionada ao access token por um `oidc-audience-mapper`.
- **Role** de realm `user`; usuário de teste `testuser` / `testpassword` (`testuser@auditoria.local`).
- **Issuer público vs JWKS interno** (importante): o token é emitido com
  `iss=http://localhost:8080/realms/auditoria` (definido por `KC_HOSTNAME`, que vem de
  `KEYCLOAK_HOSTNAME`); o backend valida esse `iss`, mas busca as chaves no endereço **interno**
  `http://keycloak:8080/.../certs` (`KEYCLOAK_JWKS_URL`). O `KEYCLOAK_ISSUER` do backend é
  derivado de `KEYCLOAK_HOSTNAME` no compose — mude o host público em **um lugar só**
  (`KEYCLOAK_HOSTNAME`); o `NEXT_PUBLIC_KEYCLOAK_URL` do frontend também deriva dele.
- **`KEYCLOAK_PORT` × `KEYCLOAK_HOSTNAME`** (importante): `KEYCLOAK_PORT` só mapeia a porta no
  host; a URL/issuer pública vem de `KEYCLOAK_HOSTNAME`. Trocar só a porta deixa `iss`/browser
  apontando para `:8080`. Ao mudar a porta, atualize `KEYCLOAK_HOSTNAME` também.
- **Healthcheck**: a imagem Keycloak 26 é UBI-based, **não tem `curl`/`wget`**. Com
  `KC_HEALTH_ENABLED=true` os endpoints `/health/*` ficam na porta de management **9000**
  (não em 8080). O healthcheck usa `bash` + `/dev/tcp` + `grep` para checar `/health/ready`.
  Se falhar com "Unrecognized field" no log, é erro no JSON de import (o container reinicia em loop).
- **Reset do realm**: `docker compose down -v` apaga `keycloak-pgdata`; como o import é bind
  read-only (não volume), o realm é reimportado do JSON no próximo `up`.
- **Smoke test** (password grant, com o stack no ar):

```bash
curl -s -X POST http://localhost:8080/realms/auditoria/protocol/openid-connect/token \
  -d grant_type=password -d client_id=auditoria-frontend \
  -d username=testuser -d password=testpassword -d scope=openid
# decodifique o access_token: iss=http://localhost:8080/realms/auditoria e aud inclui auditoria-backend
```

- **Envs do frontend** (`NEXT_PUBLIC_KEYCLOAK_*`) são **build args** do Next (inlined no bundle
  via `build.args` no compose) — alterá-las exige `--build`. **Não** defina
  `NEXT_PUBLIC_KEYCLOAK_URL` no `.env`: ele deriva de `KEYCLOAK_HOSTNAME` (ver README).

## Smoke test de dev

Fluxo de dev (backend/frontend locais, sem nginx) no `README.md` (*Modo 1*). Com `postgres` +
`keycloak` no ar, `uvicorn` em `:8000` e `next dev` em `:3000`:

```bash
# discovery direto no Keycloak
curl -s http://localhost:8080/realms/auditoria/.well-known/openid-configuration | jq .issuer
# esperado: http://localhost:8080/realms/auditoria

# token (password grant — habilitado só para smoke test)
TOKEN=$(curl -s -X POST http://localhost:8080/realms/auditoria/protocol/openid-connect/token \
  -d grant_type=password -d client_id=auditoria-frontend \
  -d username=testuser -d password=testpassword | jq -r .access_token)

# API via rewrite do Next (mesma origem do browser): sem token → 401 ; com token → 200
curl -s -o /dev/null -w "sem token: %{http_code}\n" http://localhost:3000/api/integrations
curl -s -o /dev/null -w "com token: %{http_code}\n" -H "Authorization: Bearer $TOKEN" http://localhost:3000/api/integrations
```

No browser: abra `http://localhost:3000` → **Entrar** → `testuser`/`testpassword` → confirme
`/api/integrations` com header `Authorization` (200) → **Sair**.

## Gotchas

- `.env` não é versionado (`.gitignore`). Crie com `cp .env.example .env`. Credenciais padrão
  `postgres/postgres/auditoria`; defaults embutidos no compose usam `${VAR:-default}`.
- **Sincronia de credenciais**: `infra/.env` (postgres) e `backend/.env` (uvicorn local) devem
  bater em `POSTGRES_USER/PASSWORD/DB`. Defaults coincidem nos dois.
- **Host do banco diverge**: dev (uvicorn local) usa `localhost:5432`; no Docker é `postgres`
  (serviço de rede). `POSTGRES_HOST` no compose tem default `postgres`.
- **Seed só roda na 1ª criação do volume** (`scripts/init.sql`). Reset completo:
  `docker compose down -v && docker compose up -d postgres`.
- **Imagem não contém `.env`**: Dockerfile do backend copia só `pyproject.toml` + `app/`;
  toda config chega por env vars do compose.
- **Build do backend usa `build.network: host`** no compose — necessário porque o build padrão
  (bridge do BuildKit) falha com SSL ao baixar pacotes PyPI nesta máquina. Não "corrija"
  removendo; é intencional.
- **Docker 29 / Compose v5 (bake): `docker compose up -d --build` pode abortar** com
  `additional privileges requested: pass "--allow=network.host"...`. O Compose v5 delega ao
  `buildx bake`, que exige entitlement explícito para `network: host` (e para contextos fora do
  cwd). Workaround validado:
  `docker compose build --print 2>/dev/null > /tmp/bake.json` e depois
  `BUILDX_BAKE_ENTITLEMENTS_FS=0 docker buildx bake --allow=network.host -f /tmp/bake.json`,
  seguido de `docker compose up -d` (sem `--build`). Alternativa: `activate`/configurar
  entitlements do builder. Sem isso, o `--build` falha **silenciosamente** e sobe imagens antigas.
- **Conflito de nome de container**: `auditoria-postgres` pode existir de setups antigos
  (compose do backend). Remova: `docker rm -f auditoria-postgres`.
- **Nginx** usa `nginx:alpine` com template via `envsubst` (comando `command:` no compose).
  As variáveis substituídas são `${BACKEND_URL}` e `${KEYCLOAK_URL}` — **mantenha o `command`
  e o `nginx.conf` em sincronia**: adicionar uma nova var no template exige incluir `$${VAR}` na
  lista do `envsubst`. `/api/*` proxeia para o backend, o resto vai para o `nextjs`.
- **`.env` não é versionado** — ao adicionar envs novas, atualize também `.env.example`.
