#!/usr/bin/env bash
# Applies the migrations to a throwaway database on a local plain Postgres and
# runs the row-level security checks. Requires psql and a server you can reach
# as a superuser (defaults: PGUSER=postgres, PGHOST=localhost).
set -euo pipefail
cd "$(dirname "$0")/.."
DB="ff_rls_test_$$"
createdb "$DB"
trap 'dropdb --if-exists "$DB"' EXIT
psql -v ON_ERROR_STOP=1 -q -d "$DB" -f supabase/tests/auth_shim.sql
for f in supabase/migrations/*.sql; do
  psql -v ON_ERROR_STOP=1 -q -d "$DB" -f "$f"
done
for f in supabase/tests/*_test.sql; do
  psql -v ON_ERROR_STOP=1 -q -d "$DB" -f "$f"
done
