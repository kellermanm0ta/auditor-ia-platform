#!/usr/bin/env bash
set -euo pipefail

: "${POSTGRES_USER:?POSTGRES_USER is required}"
: "${POSTGRES_PASSWORD:?POSTGRES_PASSWORD is required}"
: "${KEYCLOAK_DB:?KEYCLOAK_DB is required}"
: "${KEYCLOAK_DB_USER:?KEYCLOAK_DB_USER is required}"
: "${KEYCLOAK_DB_PASSWORD:?KEYCLOAK_DB_PASSWORD is required}"

export PGPASSWORD="$POSTGRES_PASSWORD"

# Idempotent: creates the Keycloak role/database on the shared Postgres and
# keeps the role password in sync with the compose env.
psql -h postgres -U "$POSTGRES_USER" -d postgres -v ON_ERROR_STOP=1 \
  -v kc_user="$KEYCLOAK_DB_USER" \
  -v kc_pass="$KEYCLOAK_DB_PASSWORD" \
  -v kc_db="$KEYCLOAK_DB" <<'SQL'
SELECT format('CREATE ROLE %I LOGIN PASSWORD %L', :'kc_user', :'kc_pass')
WHERE NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = :'kc_user')\gexec
SELECT format('ALTER ROLE %I WITH LOGIN PASSWORD %L', :'kc_user', :'kc_pass')\gexec
SELECT format('CREATE DATABASE %I OWNER %I', :'kc_db', :'kc_user')
WHERE NOT EXISTS (SELECT 1 FROM pg_database WHERE datname = :'kc_db')\gexec
SELECT format('ALTER DATABASE %I OWNER TO %I', :'kc_db', :'kc_user')
WHERE EXISTS (SELECT 1 FROM pg_database WHERE datname = :'kc_db')\gexec
SQL

echo "keycloak database '${KEYCLOAK_DB}' ready (owner: ${KEYCLOAK_DB_USER})"
