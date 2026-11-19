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
  editar o JSON e reiniciar **não** aplica as mudanças — é preciso recriar o database `keycloak`
  (ver *Reset do realm* abaixo).
- **Imagem própria + modo produção**: o serviço usa `build: ./keycloak` (`keycloak/Dockerfile`,
  `kc.sh build` com `KC_DB=postgres`) e roda `start --optimized --import-realm`. Não volte para
  `start-dev`. O tema **não** tem mais hot-reload: editar `keycloak/themes/` exige reiniciar o
  container. JVM limitada por `JAVA_OPTS_APPEND` (`-Xmx320m`, `MaxMetaspaceSize=192m`) e
  `mem_limit: 640m` — subir `heap`/metaspace sem revisar o limite reinicia em OOM.
- **Sem credenciais versionadas**: o `users` do `realm-export.json` usa placeholders
  `${KEYCLOAK_DEV_USER}` / `${KEYCLOAK_DEV_USER_PASSWORD}`, resolvidos a partir do env do
  container (ver `.env`/`.env.example`). Não coloque senha literal no JSON.
- **Client público** `auditoria-frontend` (PKCE S256, `standardFlow` + `directAccessGrants`).
  `directAccessGrantsEnabled` está ligado **apenas para permitir smoke-test via password grant**
  — em produção pode ser desligado.
- **Audience** `auditoria-backend` adicionada ao access token por um `oidc-audience-mapper`.
- **Role** de realm `user`; usuário de teste criado a partir dos placeholders
  `KEYCLOAK_DEV_USER` / `KEYCLOAK_DEV_USER_PASSWORD` (no `.env`, obrigatórios; email fixo
  `dev@auditoria.local`).
- **Tema de login** `auditoria` (dark, alinhado ao dashboard): em `keycloak/themes/auditoria/login/`
  (mount `./keycloak/themes:/opt/keycloak/themes:ro`), ativado por `loginTheme` no `realm-export.json`.
  Herda do tema `keycloak` (`parent=keycloak`, `styles=css/login.css css/auditoria.css`) e sobrescreve
  **apenas CSS/logo** (`resources/css/auditoria.css`, `resources/img/auditoria-logo.svg`) — evite
  sobrescrever templates `.ftl`. Os assets são servidos em `/resources/<hash>/login/auditoria/...`.
- **Issuer público vs JWKS interno** (importante): o token é emitido com
  `iss=https://localhost/realms/auditoria` (definido por `KC_HOSTNAME`, que vem de
  `KEYCLOAK_HOSTNAME` e é servido pelo nginx com TLS); o backend valida esse `iss`, mas busca as
  chaves no endereço **interno** `http://keycloak:8080/.../certs` (`KEYCLOAK_JWKS_URL`). O
  `KEYCLOAK_ISSUER` do backend é derivado de `KEYCLOAK_HOSTNAME` no compose — mude o host público
  em **um lugar só** (`KEYCLOAK_HOSTNAME`); o `NEXT_PUBLIC_KEYCLOAK_URL` do frontend também deriva
  dele.
- **TLS**: o nginx termina TLS (80→301 para 443) com cert autoassinado em `infra/certs/`
  (`fullchain.pem`/`privkey.pem`, gitignored) e envia `X-Forwarded-Proto https` — não troque por
  `$scheme` (atrás do TLS o `$scheme` é http). O realm usa `sslRequired: external`. O browser
  avisa do cert uma vez; `curl` precisa de `-k`. Ao trocar host/IP, regenere o cert com SAN
  correspondente **e** rebuilde o frontend (build arg `NEXT_PUBLIC_KEYCLOAK_URL`).
- **`KEYCLOAK_PORT` × `KEYCLOAK_HOSTNAME`** (importante): `KEYCLOAK_PORT` só mapeia a porta de
  **admin** no host (`127.0.0.1:8080`, túnel SSH); a URL/issuer pública vem de `KEYCLOAK_HOSTNAME`
  e chega ao browser via nginx (`https://<host>/realms/...`). Trocar só a porta deixa `iss`/browser
  errados. Ao mudar o host público, atualize `KEYCLOAK_HOSTNAME` (e o cert) também.
- **Healthcheck**: a imagem Keycloak 26 é UBI-based, **não tem `curl`/`wget`**. Com
  `KC_HEALTH_ENABLED=true` os endpoints `/health/*` ficam na porta de management **9000**
  (não em 8080). O healthcheck usa `bash` + `/dev/tcp` + `grep` para checar `/health/ready`.
  Se falhar com "Unrecognized field" no log, é erro no JSON de import (o container reinicia em loop).
- **Reset do realm**: o Keycloak compartilha o Postgres da aplicação (database `keycloak`,
  owner `keycloak`, criado pelo serviço one-shot `db-init`). Para reimportar sem tocar nos dados
  da aplicação:
  ```bash
  docker compose stop keycloak
  docker compose exec postgres psql -U postgres -c 'DROP DATABASE keycloak WITH (FORCE);'
  docker compose run --rm db-init
  docker compose up -d keycloak
  ```
  **Não** use `docker compose down -v`: apaga `pgdata` e com isso o seed/dados da aplicação.
- **Smoke test** (password grant, com o stack no ar):

```bash
# credenciais vêm de infra/.env (exporte antes de rodar)
set -a; . ./.env; set +a
curl -sk -X POST https://localhost/realms/auditoria/protocol/openid-connect/token \
  -d grant_type=password -d client_id=auditoria-frontend \
  -d username="$KEYCLOAK_DEV_USER" -d password="$KEYCLOAK_DEV_USER_PASSWORD" -d scope=openid
# decodifique o access_token: iss=https://localhost/realms/auditoria e aud inclui auditoria-backend
# (cert self-signed -> -k; o Keycloak é acessado via nginx, não em :8080)
```

- **Envs do frontend** (`NEXT_PUBLIC_KEYCLOAK_*`) são **build args** do Next (inlined no bundle
  via `build.args` no compose) — alterá-las exige `--build`. **Não** defina
  `NEXT_PUBLIC_KEYCLOAK_URL` no `.env`: ele deriva de `KEYCLOAK_HOSTNAME` (ver README).

## Smoke test de dev

Fluxo de dev (backend/frontend locais, sem nginx) no `README.md` (*Modo 1*). Como o `.env` aponta
o issuer para `https://localhost` (nginx), no Modo 1 force o issuer HTTP direto do Keycloak:

```bash
# sem nginx: sobrepõe o .env só nesta invocação
KEYCLOAK_HOSTNAME=http://localhost:8080 docker compose up -d postgres keycloak
```

Com `postgres` + `keycloak` no ar, `uvicorn` em `:8000` e `next dev` em `:3000`:

```bash
# credenciais do usuário de teste (exporta infra/.env)
set -a; . infra/.env; set +a

# discovery direto no Keycloak (issuer HTTP, coerente com backend/.env e frontend/.env.local)
curl -s http://localhost:8080/realms/auditoria/.well-known/openid-configuration | jq .issuer
# esperado: http://localhost:8080/realms/auditoria

# token (password grant — habilitado só para smoke test)
TOKEN=$(curl -s -X POST http://localhost:8080/realms/auditoria/protocol/openid-connect/token \
  -d grant_type=password -d client_id=auditoria-frontend \
  -d username="$KEYCLOAK_DEV_USER" -d password="$KEYCLOAK_DEV_USER_PASSWORD" | jq -r .access_token)

# API via rewrite do Next (mesma origem do browser): sem token → 401 ; com token → 200
curl -s -o /dev/null -w "sem token: %{http_code}\n" http://localhost:3000/api/integrations
curl -s -o /dev/null -w "com token: %{http_code}\n" -H "Authorization: Bearer $TOKEN" http://localhost:3000/api/integrations
```

No browser: abra `http://localhost:3000` → **Entrar** → credenciais de `KEYCLOAK_DEV_USER`/
`KEYCLOAK_DEV_USER_PASSWORD` (`infra/.env`) → confirme
`/api/integrations` com header `Authorization` (200) → **Sair**.

## Gotchas

- `.env` não é versionado (`.gitignore`). Crie com `cp .env.example .env` e **preencha todas as
  variáveis**: o compose usa `${VAR}` sem fallback — sem o `.env` o stack não sobe. Única exceção:
  `NEXT_PUBLIC_KEYCLOAK_URL`, que deriva de `KEYCLOAK_HOSTNAME` quando omitida. `NGINX_TLS_PORT`
  é obrigatória (ex.: `443`) e `infra/certs/` precisa existir com o par fullchain/privkey.
- **Sincronia de credenciais**: `infra/.env` (postgres) e `backend/.env` (uvicorn local) devem
  bater em `POSTGRES_USER/PASSWORD/DB`. Os valores precisam ser idênticos nos dois.
- **Host do banco diverge**: dev (uvicorn local) usa `localhost:5432`; no Docker é `postgres`
  (serviço de rede) — defina `POSTGRES_HOST` no `.env` de acordo.
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
- **Postgres único**: `postgres` hospeda os databases `auditoria` (owner `POSTGRES_USER`,seed
  `scripts/init.sql`) e `keycloak` (owner `KEYCLOAK_DB_USER`). O `keycloak-db` foi removido.
  O `db-init` (one-shot, idempotente, `scripts/create-keycloak-db.sh`) garante role/database do
  Keycloak no `postgres` mesmo em volumes `pgdata` já existentes — `init.sql` só roda na 1ª
  criação do volume, então **não** dependa dele para criar o DB do Keycloak.
- **Aplicar `loginTheme`/tema exige reimportar o realm** (`--import-realm` ignora realm existente)
  — use o *Reset do realm* acima. Sem hot-reload de tema: reinicie o container após editar
  `keycloak/themes/`.
- **Nginx** usa `nginx:alpine` com template via `envsubst` (comando `command:` no compose).
  As variáveis substituídas são `${BACKEND_URL}` e `${KEYCLOAK_URL}` — **mantenha o `command`
  e o `nginx.conf` em sincronia**: adicionar uma nova var no template exige incluir `$${VAR}` na
  lista do `envsubst`. O template tem dois server blocks: `:80` (301→https) e `:443 ssl`
  (`/etc/nginx/certs`, mount `./certs:ro`). `/api/*` e `/health` vão para o backend, o resto vai
  para o `nextjs`; OIDC vai para o Keycloak. Mantenha `X-Forwarded-Proto https` (não `$scheme`).
- **`.env` não é versionado** — ao adicionar envs novas, atualize também `.env.example`.
