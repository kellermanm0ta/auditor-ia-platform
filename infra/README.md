# AuditorIA — Infraestrutura

> **Fonte de verdade factual** (serviços, portas, `container_name`, rotas do nginx, variáveis
> de ambiente, pré-requisitos). Em divergência com qualquer outro doc, este prevalece. Regras
> de operação e armadilhas estão em [`AGENTS.md`](./AGENTS.md).

Docker Compose + Nginx que orquestram a stack completa do **AuditorIA**, e também
servem banco + Keycloak para desenvolvimento local.

| Serviço   | Imagem / Build                          | Papel                                    |
|-----------|-----------------------------------------|------------------------------------------|
| `postgres` | `postgres:15` + `scripts/init.sql` (seed) | Banco de dados da aplicação (porta 5432 no host) |
| `keycloak-db` | `postgres:15`                        | Banco isolado do Keycloak (sem porta no host) |
| `keycloak` | `quay.io/keycloak/keycloak:26.4.0`     | IdP OIDC (`start-dev --import-realm`, porta 8080; tema de login `auditoria`) |
| `backend` | build de `../backend` (`backend/Dockerfile`) | API REST (FastAPI + Uvicorn, porta 8000) |
| `nextjs`  | build de `../frontend` (`frontend/Dockerfile`) | Web app (Next.js, porta 3000)     |
| `nginx`   | `nginx:alpine` (proxy)                  | Entrada única (porta 80); proxy `/api/*` e OIDC |

Volumes: `pgdata` (aplicação) e `keycloak-pgdata` (Keycloak).

Todo o setup do banco (Compose + seed) que antes ficava no backend agora vive aqui.
O `backend/` não tem mais `docker-compose.yml` nem `scripts/`.

### Tema de login

O Keycloak usa o tema `auditoria` (em `keycloak/themes/auditoria/`, montado em
`/opt/keycloak/themes`), ativado por `loginTheme` no `realm-export.json`. Segue o visual do
dashboard (dark, accent `#6c5ce7`): herda do tema `keycloak` e sobrescreve só CSS/logo. O
compose desliga o cache de temas em dev; detalhes e gotchas em [`AGENTS.md`](./AGENTS.md).

## Repositórios dependentes

Este projeto orquestra os demais serviços do AuditorIA (builda as imagens a partir dos
seus Dockerfiles e os conecta na rede):

| Projeto | Repositório |
|---|---|
| API REST (backend) | `git@github.com:kellermanm0ta/auditor-ia-backend.git` |
| Web app (frontend) | `git@github.com:kellermanm0ta/auditor-ia.git` |

Clone-os no mesmo nível deste repo para a stack subir (o compose usa `../backend` e `../frontend`).

## Pré-requisitos

- **Docker** 24+
- **Docker Compose** v2.23+ (plugin `docker compose`, não `docker-compose`)
  - Em **Docker 29 / Compose v5**, `up --build` pode exigir entitlements — ver gotcha em
    [`AGENTS.md`](./AGENTS.md).

## Configuração inicial

```bash
cp .env.example .env
```

O Compose lê o `.env` do `infra/`. Se algo for omitido, usa defaults sensíveis.

---

## Modo 1 — Desenvolvimento local (sem nginx)

Sobe o PostgreSQL **e o Keycloak** (obrigatório: sem ele o front não autentica e `/api/*`
responde `401`). Backend e frontend rodam na sua máquina (sem Docker), com hot-reload.

```bash
cd infra
docker compose up -d postgres keycloak
# auditoria-postgres — porta 5432 no host
# auditoria-keycloak — porta 8080 no host (keycloak-db sobe por depends_on)
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
> em `http://localhost:8080`.

### Sync de credenciais

O `backend/.env` (usado pelo `uvicorn` local) e o `infra/.env` (usado pelo postgres) precisam
coincidir em `POSTGRES_USER`, `POSTGRES_PASSWORD` e `POSTGRES_DB`. Defaults de ambos:
`postgres` / `postgres` / `auditoria`.

---

## 2 — Stack completa (produção)

Sobe todos os serviços (postgres + keycloak-db + keycloak + api + web + nginx) — reproduz o
ambiente de produção:

```bash
cd infra
docker compose up -d --build
```

Acessos:

| Recurso | URL |
|-------------|---------|
| Web app | http://localhost/ |
| API (Swagger) | http://localhost/docs |
| Health check | http://localhost/health |
| Keycloak | http://localhost:8080/ |

> O Nginx é a única porta exposta além do postgres (5432) e do Keycloak (8080). Backend e
> frontend ficam isolados na rede `app-network`.

### Rotação

```bash
docker compose up -d            # sobe usando imagens já construídas
docker compose up -d --build    # sobe reconstruindo as imagens
docker compose down             # derruba (mantém os volumes pgdata/keycloak-pgdata)
docker compose down -v          # derruba e apaga os volumes (perde dados/seed e reimporta o realm)
docker compose logs -f backend  # acompanhar logs
docker compose logs -f keycloak # erros de import do realm aparecem aqui
```

---

## Estrutura

```
infra/
├── docker-compose.yml   # orquestração (postgres, keycloak-db, keycloak, backend, nextjs, nginx)
├── nginx.conf           # proxy: / -> nextjs, /api/* -> backend, OIDC -> keycloak
├── keycloak/
│   ├── realm-export.json # realm auditoria (bind read-only em /opt/keycloak/data/import)
│   └── themes/
│       └── auditoria/login/  # tema de login (dark) — parent=keycloak
├── scripts/
│   └── init.sql         # seed do banco (executado na 1ª subida do postgres)
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

A execução segue a cadeia: **orquestrador → Arquitetura → Code Smell → Desempenho → Segurança**. A ordem de execução real é a topológica da DAG (raiz primeiro).

Para consultar a cadeia:

```sql
SELECT a.id, a.nome AS agente, b.nome AS depende_de
FROM workflow_agents a
LEFT JOIN workflow_agents b ON a.depende_de = b.id
ORDER BY a.created_at;
```

## Configuração (`infra/.env`)

| Variável | Padrão | Descrição |
|----------|--------|------|
| `POSTGRES_USER` | `postgres` | Usuário do banco |
| `POSTGRES_PASSWORD` | `postgres` | Senha do banco |
| `POSTGRES_DB` | `auditoria` | Nome do banco |
| `POSTGRES_HOST` | `postgres` | Host do banco visto de dentro da rede docker |
| `POSTGRES_PORT` | `5432` | Porta do postgres exposta no host |
| `DEBUG` | `true` | Debug do backend |
| `NGINX_PORT` | `80` | Porta do nginx no host |
| `BACKEND_URL` | `http://backend:8000` | Destino do proxy `/api/*` |
| `KEYCLOAK_PORT` | `8080` | Porta pública do Keycloak no host (acoplada a `KEYCLOAK_HOSTNAME` — ver [`AGENTS.md`](./AGENTS.md)) |
| `KEYCLOAK_ADMIN` / `KEYCLOAK_ADMIN_PASSWORD` | `admin` / `agentesT2` | Admin bootstrap (trocar em produção) |
| `KEYCLOAK_DEV_USER` / `KEYCLOAK_DEV_USER_PASSWORD` | `dev` / `agentesT2` | Usuário de teste do realm (dev-only); placeholders do `realm-export.json` |
| `KEYCLOAK_DB_USER` / `KEYCLOAK_DB_PASSWORD` / `KEYCLOAK_DB` | `keycloak` | Banco dedicado do Keycloak |
| `KEYCLOAK_URL` | `http://keycloak:8080` | URL interna (nginx e JWKS do backend) |
| `KEYCLOAK_HOSTNAME` | `http://localhost:8080` | Host público/issuer; **fonte única** — dele derivam `KEYCLOAK_ISSUER` (backend) e `NEXT_PUBLIC_KEYCLOAK_URL` (frontend) |
| `NEXT_PUBLIC_KEYCLOAK_REALM` | `auditoria` | Realm do frontend (build arg) |
| `NEXT_PUBLIC_KEYCLOAK_CLIENT_ID` | `auditoria-frontend` | Client OIDC do frontend (build arg) |

## Rotas do Nginx

| Location | Destino | Notas |
|--------------|-----------|------|
| `/_next/static` | `nextjs:3000` | Cache `immutable`, expiry 1y |
| `/api/*` | `$BACKEND_URL` | Proxy para a API (backend:8000) |
| `/docs`, `/redoc`, `/openapi.json` | `$BACKEND_URL` | Documentação da API |
| `~ ^/(realms\|resources\|js)/` | `$KEYCLOAK_URL` | OIDC + assets do Keycloak |
| `~ ^/\.well-known/` | `$KEYCLOAK_URL` | Discovery OIDC |
| `/` | `nextjs:3000` | Web app |

## Solução de problemas

- **`Conflict. The container name "/auditoria-postgres" is already in use`**: container criado
  com o compose antigo (`backend/docker-compose.yml`). Remova: `docker rm -f auditoria-postgres`
  e suba novamente pelo `infra/`.
- **Seed não é aplicado em banco já criado**: `init.sql` só roda na 1ª criação do volume. Reset:
  `docker compose down -v && docker compose up -d postgres`.
- **Realm do Keycloak não reimporta**: veja o gotcha do `--import-realm` em
  [`AGENTS.md`](./AGENTS.md).
