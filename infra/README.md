# AuditorIA — Infraestrutura

> **Fonte de verdade factual** (serviços, portas, `container_name`, rotas do nginx, variáveis
> de ambiente, pré-requisitos). Em divergência com qualquer outro doc, este prevalece. Regras
> de operação e armadilhas estão em [`AGENTS.md`](./AGENTS.md).

Docker Compose + Nginx que orquestram a stack completa do **AuditorIA**, e também
servem banco + Keycloak para desenvolvimento local.

| Serviço   | Imagem / Build                          | Papel                                    |
|-----------|-----------------------------------------|------------------------------------------|
| `postgres` | `postgres:15` + `scripts/init.sql` (seed) | Banco único da aplicação + Keycloak (porta 5432 no host, só em `127.0.0.1`) |
| `db-init` | `postgres:15` (one-shot) | Cria role/database `keycloak` no Postgres único (idempotente) |
| `keycloak` | build de `keycloak/` (Dockerfile `start --optimized`) | IdP OIDC (porta 8080, só em `127.0.0.1`; tema `auditoria`) |
| `backend` | build de `../backend` (`backend/Dockerfile`) | API REST (FastAPI + Uvicorn, porta 8000) |
| `nextjs`  | build de `../frontend` (`frontend/Dockerfile`) | Web app (Next.js, porta 3000)     |
| `nginx`   | `nginx:alpine` (proxy + TLS)            | Entrada única (80→443); TLS, `/api/*`, `/health` e OIDC |

Volume: `pgdata` (aplicação + database `keycloak`). O Keycloak compartilha o mesmo Postgres da
aplicação; o database/role são criados pelo serviço one-shot `db-init` (ver `scripts/create-keycloak-db.sh`).

### TLS (local e VPS)

O nginx termina TLS com cert autoassinado em `infra/certs/` (`fullchain.pem` + `privkey.pem`,
**gitignored**), montado em `/etc/nginx/certs`. O browser avisa uma vez; `curl` precisa de `-k`.
Para regenerar (SAN obrigatório):

```bash
openssl req -x509 -newkey rsa:2048 -nodes -days 365 \
  -keyout certs/privkey.pem -out certs/fullchain.pem \
  -subj "/CN=localhost" -addext "subjectAltName=DNS:localhost,IP:127.0.0.1"
```

O Keycloak **não** é exposto publicamente: o browser fala com ele via nginx (`/realms`,
`/resources`, `/.well-known`). Na VPS, troque o SAN/cert pelo IP/domínio público e mantenha
`KEYCLOAK_HOSTNAME` igual à origem usada pelo browser.

Todo o setup do banco (Compose + seed) que antes ficava no backend agora vive aqui.
O `backend/` não tem mais `docker-compose.yml` nem `scripts/`.

### Tema de login

O Keycloak usa o tema `auditoria` (em `keycloak/themes/auditoria/`, montado em
`/opt/keycloak/themes`), ativado por `loginTheme` no `realm-export.json`. Segue o visual do
dashboard (dark, accent `#6c5ce7`): herda do tema `keycloak` e sobrescreve só CSS/logo.
O compose roda em modo produção (`start --optimized`), **sem hot-reload de tema**: após editar
`keycloak/themes/`, reinicie o container. Detalhes e gotchas em [`AGENTS.md`](./AGENTS.md).

## Projetos orquestrados

Este é um **monorepo**: `infra/` builda as imagens dos projetos irmãos `../backend` e
`../frontend`, que já estão no mesmo repositório (o compose usa esses caminhos relativos).

| Projeto | Diretório | Dockerfile |
|---|---|---|
| API REST (backend) | [`../backend`](../backend) | `backend/Dockerfile` |
| Web app (frontend) | [`../frontend`](../frontend) | `frontend/Dockerfile` |

## Pré-requisitos

- **Docker** 24+
- **Docker Compose** v2.23+ (plugin `docker compose`, não `docker-compose`)
  - Em **Docker 29 / Compose v5**, `up --build` pode exigir entitlements — ver gotcha em
    [`AGENTS.md`](./AGENTS.md).

## Configuração inicial

```bash
cp .env.example .env
```

O Compose lê o `.env` do `infra/`. **Todas as variáveis são obrigatórias** (sem defaults):
`cp .env.example .env` e preencha antes de subir. A única exceção é `NEXT_PUBLIC_KEYCLOAK_URL`,
que deriva de `KEYCLOAK_HOSTNAME` quando omitida. Além do `.env`, `infra/certs/` precisa existir
com `fullchain.pem` + `privkey.pem` (ver *TLS* acima).

---

## Modo 1 — Desenvolvimento local (sem nginx)

Sobe o PostgreSQL **e o Keycloak** (obrigatório: sem ele o front não autentica e `/api/*`
responde `401`). Backend e frontend rodam na sua máquina (sem Docker), com hot-reload.

```bash
cd infra
# Modo 1 não usa nginx: force o issuer HTTP direto do Keycloak (sobrepõe o .env,
# que por padrão aponta para https://localhost via nginx).
KEYCLOAK_HOSTNAME=http://localhost:8080 docker compose up -d postgres keycloak
# auditoria-postgres — porta 5432 no host
# auditoria-keycloak — porta 8080 no host (127.0.0.1; db-init prepara o database no postgres)
```

Com o postgres e o Keycloak de pé, rode a API e o web app em terminais separados:

```bash
# backend (FastAPI) — a partir de backend/ (lê backend/.env, com KEYCLOAK_ISSUER/JWKS em localhost:8080)
cd ../backend
source .venv/bin/activate
uvicorn app.main:app --reload      # http://localhost:8000/docs

# frontend (Next.js) — a partir de ../frontend
cd ../frontend
npm install
npm run dev                        # http://localhost:3000
```

> O `next.config.ts` do frontend tem proxy de dev `/api/*` → `http://localhost:8000/api/*`,
> então **não há CORS** e o nginx não é necessário em dev.
> O postgres local é alcançado em `localhost:5432` (variáveis do `backend/.env`); o Keycloak,
> em `http://localhost:8080`. Por isso o override `KEYCLOAK_HOSTNAME=...` acima é obrigatório:
> `backend/.env` e `frontend/.env.local` esperam o issuer `http://localhost:8080`.

### Sync de credenciais

O `backend/.env` (usado pelo `uvicorn` local) e o `infra/.env` (usado pelo postgres) precisam
coincidir em `POSTGRES_USER`, `POSTGRES_PASSWORD` e `POSTGRES_DB`.

---

## 2 — Stack completa (produção)

Sobe todos os serviços (postgres + db-init + keycloak + api + web + nginx) — reproduz o
ambiente de produção:

```bash
cd infra
docker compose up -d --build
```

> Em Docker 29 / Compose v5, o `--build` pode falhar por causa de `build.network: host` no
> backend — use o workaround descrito em [`AGENTS.md`](./AGENTS.md) (`buildx bake` com
> `--allow=network.host`, seguido de `docker compose up -d`).

Acessos:

| Recurso | URL |
|-------------|---------|
| Web app | https://localhost/ |
| API (Swagger) | https://localhost/docs |
| Health check | https://localhost/health |
| Keycloak (via nginx) | https://localhost/realms/auditoria/ |
| Keycloak admin (local) | http://127.0.0.1:8080/admin (túnel SSH na VPS) |

> O browser exibe um aviso de certificado autoassinado na primeira visita — aceite para continuar
> (é um secure context, então o login/PKCE funciona). Em `curl`, use `-k`.
> A porta 80 só redireciona para 443. Postgres e Keycloak escutam **apenas em `127.0.0.1`**;
> backend e frontend ficam isolados na rede `app-network`.

> **Trocar `KEYCLOAK_HOSTNAME` (ex.: domínio/IP na VPS)** muda o issuer/JWKS público e o
> `NEXT_PUBLIC_KEYCLOAK_URL` → **rebuild do frontend** é obrigatório (`docker compose build nextjs`).
> O cert em `certs/` precisa cobrir o mesmo host (SAN).

### Rotação

```bash
docker compose up -d            # sobe usando imagens já construídas
docker compose up -d --build    # sobe reconstruindo as imagens
docker compose down             # derruba (mantém o volume pgdata)
docker compose down -v          # derruba e apaga pgdata (perde dados/seed E o database do Keycloak)
docker compose logs -f backend  # acompanhar logs
docker compose logs -f keycloak # erros de import do realm aparecem aqui
```

---

## Estrutura

```
infra/
├── docker-compose.yml   # orquestração (postgres, db-init, keycloak, backend, nextjs, nginx)
├── nginx.conf           # proxy: / -> nextjs, /api/* -> backend, OIDC -> keycloak
├── certs/               # TLS self-signed (fullchain.pem + privkey.pem) — gitignored
├── keycloak/
│   ├── Dockerfile        # imagem do Keycloak (kc.sh build -> start --optimized)
│   ├── realm-export.json # realm auditoria (bind read-only em /opt/keycloak/data/import)
│   └── themes/
│       └── auditoria/login/  # tema de login (dark) — parent=keycloak
├── scripts/
│   ├── init.sql         # seed da aplicação (executado na 1ª subida do postgres)
│   └── create-keycloak-db.sh  # cria role/database do Keycloak no Postgres único (idempotente)
├── .env                 # variáveis locais (não versionar)
├── .env.example         # modelo versionado
└── README.md
backend/
└── Dockerfile           # imagem da API (contexto = backend/)
frontend/
└── Dockerfile           # imagem do Next.js (contexto = frontend/)
```

### Dockerfiles na raiz dos projetos

Cada serviço é self-contained: `docker build backend/` e `docker build frontend/` geram as
imagens diretamente. O compose usa `build.context` apontando para cada pasta e o Dockerfile
padrão (`Dockerfile`) de cada uma.

## Fluxo da API (fora vs. dentro do container)

| Ambiente | `POSTGRES_HOST` | Por quê |
|--------------|-----------------|-------|
| Dev (sem Docker) | `localhost` (do `backend/.env`) | postgres roda na própria máquina |
| Docker | `postgres` (injetado no compose) | postgres é um serviço da rede |

A URL fica em `backend/app/core/settings.py` — configuração via **env**, sem valores cravados.

## IDs (hashes determinísticos)

Todas as tabelas usam `id TEXT PRIMARY KEY`, gerado automaticamente a partir de uma sequence
por tabela e hasheado com `md5`:

```sql
CREATE SEQUENCE <tabela>_id_seq;
CREATE TABLE <tabela> (
    id TEXT PRIMARY KEY DEFAULT md5(nextval('<tabela>_id_seq')::text),
    ...
);
```

- Se o `id` for **omitido** no `INSERT`, o Postgres deriva um hash do próximo valor da sequence
  (ex.: `md5('1')`). Como cada tabela tem sua própria sequence, os hashes não colidem.
- O hash é **previsível** (não é aleatório) — serve como identificador único curto, **não** como
  mecanismo de segurança/anti-enumeração.
- Os seeds de `skills`, `output_formats` e `config` usam hashes determinísticos explícitos
  (`md5('skill:seguranca')`, `md5('output_format:markdown')`, `md5('config:default')`) para que
  `config.skill_ids` e `config.output_format_id` referenciem os ids corretos já no seed.
- `config.skill_ids` guarda um array JSON com os **ids** das skills (não mais slugs/nomes).

> O `backend` e o `frontend` precisam tratar esses ids como `string` (antes eram `int`).

## Workflow de Agentes

A tabela `workflow_agents` define a ordem de execução dos agentes de análise via auto-relacionamento:

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | `TEXT PK` | Identificador único (`md5` da sequence) |
| `nome` | `VARCHAR(255)` | Nome do agente |
| `depende_de` | `TEXT FK → workflow_agents(id)` | Agente pai (define ordem de execução) |

Seed padrão (`scripts/init.sql`):

| Agente | `depende_de` |
|--------|-------------|
| orquestrador | `NULL` (raiz) |
| Análise de Arquitetura | orquestrador |
| Code Smell | Análise de Arquitetura |
| Análise de Desempenho | Code Smell |
| Análise de Segurança | Análise de Desempenho |

A ordem definida pelo grafo é: **orquestrador → Arquitetura → Code Smell → Desempenho → Segurança**
(topológica da DAG, raiz primeiro). O backend atual expõe apenas o CRUD de `workflow_agents`
(não há execução real dos agentes).

Para consultar a cadeia:

```sql
SELECT a.id, a.nome AS agente, b.nome AS depende_de
FROM workflow_agents a
LEFT JOIN workflow_agents b ON a.depende_de = b.id
ORDER BY a.created_at;
```

## Configuração (`infra/.env`)

| Variável | Exemplo | Descrição |
|----------|---------|------|
| `POSTGRES_USER` | `{postgres-user}` | Usuário do banco |
| `POSTGRES_PASSWORD` | `{postgres-password}` | Senha do banco |
| `POSTGRES_DB` | `auditoria` | Nome do banco |
| `POSTGRES_HOST` | `postgres` | Host do banco visto de dentro da rede docker |
| `POSTGRES_PORT` | `5432` | Porta do postgres exposta no host (bind `127.0.0.1`) |
| `DEBUG` | `true` | Lida por `settings.debug` no backend (atualmente sem efeito no comportamento da API) |
| `NGINX_PORT` | `80` | Porta HTTP no host (só redireciona para HTTPS) |
| `NGINX_TLS_PORT` | `443` | Porta HTTPS no host (TLS terminado no nginx) |
| `BACKEND_URL` | `http://backend:8000` | Destino do proxy `/api/*` e `/health` |
| `KEYCLOAK_PORT` | `8080` | Porta do Keycloak no host (bind `127.0.0.1`, só para admin/túnel — acoplada a `KEYCLOAK_HOSTNAME`) |
| `KEYCLOAK_ADMIN` / `KEYCLOAK_ADMIN_PASSWORD` | `{keycloak-admin}` / `{keycloak-admin-password}` | Admin bootstrap (trocar em produção) |
| `KEYCLOAK_DEV_USER` / `KEYCLOAK_DEV_USER_PASSWORD` | `{keycloak-dev-user}` / `{keycloak-dev-user-password}` | Usuário de teste do realm (dev-only); placeholders do `realm-export.json` |
| `KEYCLOAK_DB_USER` / `KEYCLOAK_DB_PASSWORD` / `KEYCLOAK_DB` | `{keycloak-db-user}` / `{keycloak-db-password}` / `keycloak` | Database/role do Keycloak no Postgres único (criados pelo `db-init`) |
| `KEYCLOAK_URL` | `http://keycloak:8080` | URL interna (nginx e JWKS do backend) |
| `KEYCLOAK_HOSTNAME` | `https://localhost` | Host público/issuer (browser→nginx); **fonte única** — dele derivam `KEYCLOAK_ISSUER` (backend) e `NEXT_PUBLIC_KEYCLOAK_URL` (frontend). Deve casar com o SAN do cert |
| `NEXT_PUBLIC_KEYCLOAK_REALM` | `auditoria` | Realm do frontend (build arg) |
| `NEXT_PUBLIC_KEYCLOAK_CLIENT_ID` | `auditoria-frontend` | Client OIDC do frontend (build arg) |

## Rotas do Nginx

| Location | Destino | Notas |
|--------------|-----------|------|
| `:80` | — | `301` para `https://$host$request_uri` |
| `/_next/static` | `nextjs:3000` | Cache `immutable`, expiry 1y |
| `/api/*` | `$BACKEND_URL` | Proxy para a API (backend:8000) |
| `/health` (exato) | `$BACKEND_URL` | Health público do backend (JSON) |
| `/docs`, `/redoc`, `/openapi.json` | `$BACKEND_URL` | Documentação da API |
| `~ ^/(realms\|resources\|js)/` | `$KEYCLOAK_URL` | OIDC + assets do Keycloak |
| `~ ^/\.well-known/` | `$KEYCLOAK_URL` | Discovery OIDC |
| `/` | `nextjs:3000` | Web app |

As locations que proxeiam para o backend e para o Keycloak enviam `X-Forwarded-Proto https`
(o Keycloak usa isso para cookies/redirects).

## Solução de problemas

- **Aviso de certificado / `SSL certificate problem`**: o cert é autoassinado (local). Aceite no
  browser; em `curl` use `-k`. Se `docker compose` reclamar de cert ausente, gere `infra/certs/`
  (ver *TLS* acima).
- **Login redireciona para host errado**: `KEYCLOAK_HOSTNAME` precisa ser exatamente a origem
  usada no browser (`https://localhost`) e o nginx precisa estar no ar.

- **`Conflict. The container name "/auditoria-postgres" is already in use`**: container criado
  com o compose antigo (`backend/docker-compose.yml`). Remova: `docker rm -f auditoria-postgres`
  e suba novamente pelo `infra/`.
- **Seed não é aplicado em banco já criado**: `init.sql` só roda na 1ª criação do volume. Reset:
  `docker compose down -v && docker compose up -d postgres` (o `down -v` também apaga o database
  do Keycloak; o realm é reimportado na subida seguinte do `keycloak`).
- **Realm do Keycloak não reimporta**: veja o gotcha do `--import-realm` em
  [`AGENTS.md`](./AGENTS.md).
