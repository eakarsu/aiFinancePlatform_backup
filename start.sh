#!/usr/bin/env bash
# Nondestructive launcher. It does not install packages, kill processes,
# mutate the database schema, or seed accounts.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
ENV_FILE="$ROOT/.env"

if [[ -f "$ENV_FILE" ]]; then
	set -a
	# shellcheck disable=SC1090
	source "$ENV_FILE"
	set +a
fi

if [[ -z "${DATABASE_URL:-}" ]]; then
	echo "error: DATABASE_URL is required; copy .env.example to .env" >&2
	exit 1
fi
jwt_secret="${JWT_SECRET:-}"
if (( ${#jwt_secret} < 32 )); then
	echo "error: JWT_SECRET must be a unique value of at least 32 characters" >&2
	exit 1
fi
if [[ ! -d "$ROOT/backend/node_modules" ]]; then
	echo "error: backend dependencies are not installed" >&2
	echo "install them explicitly in backend/ after reviewing package-lock.json" >&2
	exit 1
fi

cd "$ROOT/backend"
exec npm start
