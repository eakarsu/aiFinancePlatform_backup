#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
ENV_FILE="$ROOT/.env"
if [[ -f "$ENV_FILE" ]]; then
  set -a
  source "$ENV_FILE"
  set +a
fi

fail() { printf 'error: %s\n' "$*" >&2; exit 1; }
[[ -n "${DATABASE_URL:-}" ]] || fail "DATABASE_URL is required; copy .env.example to .env"
jwt_secret="${JWT_SECRET:-}"
(( ${#jwt_secret} >= 32 )) || fail "JWT_SECRET must be a unique value of at least 32 characters"
[[ -n "${OPENROUTER_API_KEY:-}" ]] || fail "OPENROUTER_API_KEY is required"
[[ -n "${OPENROUTER_MODEL:-}" ]] || fail "OPENROUTER_MODEL is required"
[[ "${OPENROUTER_BASE_URL:-}" == 'https://openrouter.ai/api/v1' ]] || fail "OPENROUTER_BASE_URL must be https://openrouter.ai/api/v1"
[[ "${BACKEND_PORT:-}" =~ ^[0-9]+$ ]] || fail "BACKEND_PORT must be an explicit integer"
[[ "${FRONTEND_PORT:-}" =~ ^[0-9]+$ ]] || fail "FRONTEND_PORT must be an explicit integer"
(( BACKEND_PORT >= 1024 && BACKEND_PORT <= 65535 )) || fail "BACKEND_PORT must be between 1024 and 65535"
(( FRONTEND_PORT >= 1024 && FRONTEND_PORT <= 65535 )) || fail "FRONTEND_PORT must be between 1024 and 65535"
[[ "$BACKEND_PORT" != "$FRONTEND_PORT" ]] || fail "BACKEND_PORT and FRONTEND_PORT must be different"
[[ -d "$ROOT/backend/node_modules" ]] || fail "backend dependencies are not installed"
for port in "$BACKEND_PORT" "$FRONTEND_PORT"; do
  lsof -nP -iTCP:"$port" -sTCP:LISTEN >/dev/null 2>&1 && fail "assigned port $port is occupied"
done

printf 'Starting AI Finance Platform API on %s and UI on %s; persistent state is unchanged.\n' "$BACKEND_PORT" "$FRONTEND_PORT"
exec node "$ROOT/runtime-launcher.js"
