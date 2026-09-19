# AuditorIA Backend

## Stack
- **FastAPI** + **Uvicorn** — async Python 3.11+
- **SQLAlchemy 2.0** + **psycopg2-binary** — PostgreSQL
- **Pydantic v2** / **pydantic-settings** — validation & config
- **pytest** + **pytest-asyncio** + **httpx** (via `ASGITransport`) — testing
- **Ruff** — linter + formatter (line-length 100); B008 suppressed in pyproject.toml
- **Alembic** listed as dep but **not yet configured** — tables created via `Base.metadata.create_all` on startup

## Commands

```bash
# start PostgreSQL (compose lives in ../infra — starts only postgres)
cd ../infra && docker compose up -d postgres

# run dev server (from repo root)
cd ../backend && uvicorn app.main:app --reload

# tests
pytest                                  # all
pytest tests/test_integrations.py       # single file
pytest -k "integration"                 # by name

# lint & format
ruff check .
ruff format --check .
ruff check --fix .
ruff format .

```

## Architecture

```
app/
  main.py          — FastAPI app + /health; creates DB tables via lifespan
  core/settings.py  — pydantic-settings (reads .env)
  db/session.py    — SQLAlchemy engine + session factory + get_db dependency
  models/          — ORM models (Integration with steps stored as JSON string)
  schemas/         — Pydantic request/response schemas
  services/        — business logic (DB-backed, one service per resource)
  api/routes.py             — aggregates all sub-routers
  api/integration_routes.py — /api/integrations CRUD
  api/skill_routes.py       — /api/skills CRUD
  api/output_format_routes.py — /api/output-formats CRUD
  api/history_routes.py     — /api/history CRUD
  api/config_routes.py      — /api/config GET/PUT
tests/             — pytest-asyncio tests using httpx ASGITransport
```
(Seed script `infra/scripts/init.sql` and docker-compose live in `../infra`, not here.)

## Key facts
- `.env` is gitignored; copy `.env.example` to get started
- PostgreSQL runs via the compose in `../infra` — `cd ../infra && docker compose up -d postgres` (reads env vars from `infra/.env` — no hardcoded credentials)
- `backend/.env` drives local `uvicorn`: `POSTGRES_HOST=localhost`, `POSTGRES_PORT=5432`; must match `infra/.env` creds (postgres/postgres/auditoria)
- Full stack (postgres + api + nextjs + nginx) comes up from `../infra`: `docker compose up -d --build`
- `docker compose` requires Docker Engine 24+ and Compose v2.23+; use `docker compose` (plugin), not `docker-compose`
- On Windows, activate venv with `.venv\Scripts\activate` (cmd) or `.venv\Scripts\Activate.ps1` (PowerShell)
- DB is wired into `/api/integrations` routes via `get_db` dependency
- `Integration.steps` stored as JSON string in `TEXT` column; deserialized to `list[str]` via Pydantic `@field_validator`
- Table auto-created on app startup via `Base.metadata.create_all(bind=engine)` in lifespan
- Alembic migrations **not initialized** — run `alembic init alembic` when switching to migration-based schema management
- `asyncio_mode = auto` in pyproject.toml — no need for `@pytest.mark.asyncio` on test functions, but the codebase uses it explicitly
- Ruff replaces flake8/isort/black — no other formatters
- B008 (Depends in function defaults) is suppressed — false positive for FastAPI