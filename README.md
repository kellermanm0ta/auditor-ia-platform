# AuditorIA Backend

API backend do AuditorIA, um sistema de auditoria inteligente.

## Repositório de infraestrutura dependida

O PostgreSQL e o Keycloak são orquestrados pelo repositório de infraestrutura do AuditorIA:

```
git@github.com:kellermanm0ta/auditoria-infra.git
```

Para subir o banco e o Keycloak em desenvolvimento, clone a infra num diretório irmão e rode:

```bash
cd auditoria-infra
docker compose up -d postgres keycloak
```

## Pré-requisitos

- **Docker** 24+ e **Docker Compose** v2.23+ (apenas para banco + Keycloak)
- **Python** 3.11+ (apenas para desenvolvimento fora do container)

## Setup com Docker (recomendado)

O banco é orquestrado pelo `infra/` (anti-guias de infra do repositório), não pelo backend:

```bash
# 1. Configure as variáveis de ambiente
cp .env.example .env

# 2. Sobe PostgreSQL + Keycloak (a partir de infra/)
cd ../infra
cp .env.example .env       # primeira vez
docker compose up -d postgres keycloak

# 3. Instale as dependências Python (volte para backend/)
cd ../backend
python -m venv .venv

# Linux/macOS
source .venv/bin/activate

# Windows (cmd)
.venv\Scripts\activate

# Windows (PowerShell)
.venv\Scripts\Activate.ps1

pip install -e ".[dev]"

# 4. Rode o servidor
uvicorn app.main:app --reload
```

> O docker-compose do banco e do Keycloak fica em `infra/docker-compose.yml` e lê o `infra/.env`.
> O `backend/.env` segue sendo o usado pelo `uvicorn` local: credenciais (`POSTGRES_USER`,
> `POSTGRES_PASSWORD`, `POSTGRES_DB`, `POSTGRES_HOST=localhost`, `POSTGRES_PORT=5432`) devem
> coincidir com as do banco, e `KEYCLOAK_ISSUER`/`KEYCLOAK_JWKS_URL` devem apontar para o
> Keycloak em `http://localhost:8080`.

### Docker Compose — versões compatíveis

| Plataforma | Docker Engine | Docker Compose |
|-----------|---------------|----------------|
| Linux     | 24+           | v2.23+ (plugin) |
| Windows   | 24+ (Docker Desktop) | v2.23+ (embutido) |
| macOS     | 24+ (Docker Desktop) | v2.23+ (embutido) |

Verifique a versão instalada:

```bash
docker --version       # Docker version 24.x.x
docker compose version # Docker Compose version v2.23.x
```

> **Nota**: use `docker compose` (sem hífen, plugin) — não `docker-compose`.

## Setup manual (sem Docker)

```bash
cp .env.example .env

# Certifique-se de ter um PostgreSQL em localhost:5432 e um Keycloak em localhost:8080
# (as credenciais de banco e as URLs do Keycloak devem bater com as do .env)

python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -e ".[dev]"
uvicorn app.main:app --reload
```

## Uso

```bash
# Com o PostgreSQL e o Keycloak rodando (via Docker ou manualmente)
uvicorn app.main:app --reload
```

Acesse `http://localhost:8000/docs` para a documentação interativa (Swagger).

> **Autenticação**: todas as rotas `/api/*` exigem um Bearer token válido do Keycloak (RS256,
> issuer/audience configurados pelas variáveis `KEYCLOAK_*`). Sem token a resposta é `401`;
> apenas `/health` é público. O contrato e o smoke test estão em `AGENTS.md`.

> **Payload**: todos os endpoints da API aceitam e retornam **camelCase** (ex: `statusLabel`, `docUrl`, `createdAt`).
>
> **IDs**: todas as tabelas usam `id` do tipo `TEXT` gerado automaticamente pelo banco (hash `md5`).
> O `id` é devolvido nas respostas, mas deve ser **omitido no body de criação** — o banco gera o valor.
> Nas rotas, `{id}` é sempre uma string (ex.: `POST /api/skills` não aceita `id`; o `id` retornado é o hash).

## Seed automático

Na primeira inicialização do banco, o `infra/scripts/init.sql` é executado automaticamente pelo
PostgreSQL (via compose do `infra/`), populando o banco com dados padrão:

| Tabela | Registros seedados |
|---|---|
| `integrations` | GitHub Actions, GitLab CI, Jenkins, Webhook, CLI, Slack |
| `skills` | Segurança, Arquitetura, Code Smell, Desempenho, Dependências |
| `output_formats` | Markdown, JSON, HTML, PDF |
| `history` | 5 análises de exemplo |
| `config` | Configuração inicial (modo `PARALELO`, markdown, 3 skills habilitadas) |
| `workflow_agents` | orquestrador, Análise de Arquitetura, Code Smell, Análise de Desempenho, Análise de Segurança |

Os `id` de todos os registros seedados também são gerados por hash (`TEXT`).

Para resetar o banco e recomeçar do zero (a partir de `infra/`):

```bash
docker compose down -v
docker compose up -d postgres
```

## Endpoints

| Método | Rota | Descrição |
|--------|------|-----------|
| `GET` | `/health` | Health check |
| `GET` | `/api/integrations` | Listar integrações |
| `GET` | `/api/integrations/{id}` | Buscar integração |
| `POST` | `/api/integrations` | Criar integração |
| `PUT` | `/api/integrations/{id}` | Atualizar integração |
| `DELETE` | `/api/integrations/{id}` | Remover integração |
| `GET` | `/api/skills` | Listar skills |
| `GET` | `/api/skills/{id}` | Buscar skill |
| `POST` | `/api/skills` | Criar skill |
| `PUT` | `/api/skills/{id}` | Atualizar skill |
| `DELETE` | `/api/skills/{id}` | Remover skill |
| `GET` | `/api/output-formats` | Listar formatos de saída |
| `GET` | `/api/output-formats/{id}` | Buscar formato |
| `POST` | `/api/output-formats` | Criar formato |
| `PUT` | `/api/output-formats/{id}` | Atualizar formato |
| `DELETE` | `/api/output-formats/{id}` | Remover formato |
| `GET` | `/api/history` | Listar histórico |
| `GET` | `/api/history/{id}` | Buscar item do histórico |
| `POST` | `/api/history` | Criar item no histórico |
| `PUT` | `/api/history/{id}` | Atualizar item |
| `DELETE` | `/api/history/{id}` | Remover item |
| `GET` | `/api/workflow-agents` | Listar agents |
| `GET` | `/api/workflow-agents/{id}` | Buscar agent |
| `POST` | `/api/workflow-agents` | Criar agent |
| `PUT` | `/api/workflow-agents/{id}` | Atualizar agent |
| `DELETE` | `/api/workflow-agents/{id}` | Remover agent |
| `GET` | `/api/config` | Obter configuração |
| `PUT` | `/api/config` | Atualizar configuração |

## Testes

```bash
pytest
```

> Os testes rodam contra o PostgreSQL configurado no `.env` e **excluem todos os registros que criam**,
> mantendo apenas os dados já existentes/seedados no banco.

## Lint e formatação

```bash
ruff check .
ruff format --check .
```

## Projeto

| Diretório | Finalidade |
|-----------|------------|
| `app/main.py` | Criação da aplicação FastAPI + criação automática das tabelas |
| `app/api/` | Rotas por entidade (`integration_routes`, `skill_routes`, `output_format_routes`, `history_routes`, `config_routes`, `workflow_agent_routes`) |
| `app/core/` | Configuração via pydantic-settings (`settings.py`) e validação JWT/Keycloak (`security.py`) |
| `app/db/` | Engine, sessão SQLAlchemy e dependência `get_db` |
| `app/models/` | Modelos ORM (`Integration`, `Skill`, `OutputFormat`, `History`, `Config`, `WorkflowAgent`) |
| `app/schemas/` | Schemas Pydantic de request/response |
| `app/services/` | Lógica de negócio (CRUD com DB) |
| `tests/` | Testes com pytest + httpx ASGITransport |

> Nota: `/api/config` é um singleton (um único registro, buscado sem depender de um `id` fixo). As tabelas são criadas automaticamente na inicialização da aplicação via `Base.metadata.create_all` (fallback quando roda sem Docker).
> O script de seed (`init.sql`) e o docker-compose do banco ficam em `infra/`.