# AuditorIA Backend

## Stack
- **FastAPI** + **Uvicorn** — async Python 3.11+
- **SQLAlchemy 2.0** + **psycopg2-binary** — PostgreSQL
- **Pydantic v2** / **pydantic-settings** — validation & config
- **pytest** + **pytest-asyncio** + **httpx** (via `ASGITransport`) — testing
- **PyJWT** (`pyjwt[crypto]`) — JWT validation (RS256) against Keycloak JWKS
  (`PyJWKClient` fetches JWKS via stdlib `urllib`, no extra runtime dep)
- **Ruff** — linter + formatter (line-length 100); B008 suppressed in pyproject.toml
- **Alembic** listed as dep but **not yet configured** — tables created via `Base.metadata.create_all` on startup

## Commands

```bash
# start PostgreSQL + Keycloak (compose lives in ../infra — dev also needs the IdP)
cd ../infra && docker compose up -d postgres keycloak

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
  main.py          — FastAPI app + public /health; creates DB tables via lifespan
  core/settings.py  — pydantic-settings (reads .env)
  core/security.py  — HTTPBearer + Keycloak JWKS validation (get_current_user)
  db/session.py    — SQLAlchemy engine + session factory + get_db dependency
  models/          — ORM models (Integration, Skill, OutputFormat, History, Config, WorkflowAgent)
  schemas/         — Pydantic request/response schemas
  services/        — business logic (DB-backed, one service per resource)
  api/routes.py             — aggregates all sub-routers
  api/integration_routes.py — /api/integrations CRUD
  api/skill_routes.py       — /api/skills CRUD
  api/output_format_routes.py — /api/output-formats CRUD
  api/history_routes.py     — /api/history CRUD
  api/workflow_agent_routes.py — /api/workflow-agents CRUD
  api/config_routes.py      — /api/config GET/PUT
tests/             — pytest-asyncio tests using httpx ASGITransport
  conftest.py      — autouse fixture overriding get_current_user (auth bypass)
  test_auth.py     — 401 without/with invalid Bearer; /health stays public
  test_health.py   — /health returns 200
  test_integrations.py    — /api/integrations CRUD
  test_workflow_agents.py — /api/workflow-agents CRUD
```
(Seed script `infra/scripts/init.sql` and docker-compose live in `../infra`, not here.)

## Auth (Keycloak / JWT)
- All `/api/*` routes require a valid Bearer token — enforced globally in `main.py`:
  `app.include_router(router, prefix="/api", dependencies=[Depends(get_current_user)])`
- `/health` is intentionally **public** (declared outside the authenticated router)
- `core/security.py`: `HTTPBearer(auto_error=True)` + `jwt.PyJWKClient` (cached via `lru_cache`);
  decodes with `algorithms=["RS256"]`, validating `audience` and `issuer`
- Any `InvalidTokenError` / `PyJWKClientError` → `HTTPException(401, "Invalid or expired token")`
- Frontend performs Authorization Code + PKCE; the backend only validates the access token
- Shared contract:
  - issuer: `http://localhost:8080/realms/auditoria`
  - audience: `auditoria-backend`
  - client id: `auditoria-frontend`
  - alg: RS256
- **Issuer público vs JWKS interno**: the `iss` claim is validated against the *public*
  issuer (`KEYCLOAK_ISSUER`), while JWKS is fetched from `KEYCLOAK_JWKS_URL`. Inside Docker
  the JWKS URL points at the internal service (`http://keycloak:8080/...`); for local
  `uvicorn` (outside Docker) point it at `http://localhost:8080/...`.
- Env vars (all optional, sensible dev defaults): `KEYCLOAK_ISSUER`, `KEYCLOAK_JWKS_URL`,
  `KEYCLOAK_CLIENT_ID`, `KEYCLOAK_AUDIENCE`

## Key facts
- `.env` is gitignored; copy `.env.example` to get started
- PostgreSQL and Keycloak run via the compose in `../infra` — `cd ../infra && docker compose up -d postgres keycloak` (reads env vars from `infra/.env` — no hardcoded credentials). Keycloak is required in dev too: `/api/*` returns 401 without a valid token, and `get_current_user` needs JWKS reachable at `http://localhost:8080/...` (see `backend/.env`).
- `backend/.env` drives local `uvicorn`: `POSTGRES_HOST=localhost`, `POSTGRES_PORT=5432`; must match `infra/.env` creds (postgres/postgres/auditoria)
- Full stack (postgres + api + nextjs + nginx) comes up from `../infra`: `docker compose up -d --build`
- `docker compose` requires Docker Engine 24+ and Compose v2.23+; use `docker compose` (plugin), not `docker-compose`
- On Windows, activate venv with `.venv\Scripts\activate` (cmd) or `.venv\Scripts\Activate.ps1` (PowerShell)
- DB is wired into `/api/integrations` routes via `get_db` dependency
- SQLAlchemy driver: `settings.database_url` builds an **explicit** DSN
  `postgresql+psycopg2://...` so it always resolves to the installed `psycopg2-binary`.
  Do **not** use a bare `postgresql://` DSN: SQLAlchemy 2.1+ resolves that to psycopg **v3**
  (`psycopg`), which is not installed → `ModuleNotFoundError`/crash-loop in the container.
  Chosen strategy: explicit dialect only (no SQLAlchemy `<2.2` pin, no `psycopg[binary]`).
- `Integration.steps` stored as JSON string in `TEXT` column; deserialized to `list[str]` via Pydantic `@field_validator`
- Table auto-created on app startup via `Base.metadata.create_all(bind=engine)` in lifespan
- Alembic migrations **not initialized** — run `alembic init alembic` when switching to migration-based schema management
- `asyncio_mode = auto` in pyproject.toml — no need for `@pytest.mark.asyncio` on test functions, but the codebase uses it explicitly
- Ruff replaces flake8/isort/black — no other formatters
- B008 (Depends in function defaults) is suppressed — false positive for FastAPI
- `tests/conftest.py` has an **autouse** fixture that overrides `get_current_user`, so existing
  tests run without a token; `tests/test_auth.py` removes the override to assert 401 behavior
- `get_current_user` only contacts Keycloak's JWKS on demand (first valid-looking token). A missing
  or malformed token is rejected before any network call; a valid token requires JWKS to be reachable
- Run a single file with e.g. `pytest tests/test_auth.py -v`; activate the venv first
  (`.venv/bin/pytest` or `source .venv/bin/activate`)
