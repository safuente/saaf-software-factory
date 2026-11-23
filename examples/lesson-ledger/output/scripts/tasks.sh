#!/usr/bin/env bash
# Implementation of the Makefile targets. Call through `make`, which loads .env and quiets output.
# Usage: scripts/tasks.sh <task>
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
BACKEND="$ROOT/backend"
FRONTEND="$ROOT/frontend"
SERVICES=(db backend frontend)
UP_TIMEOUT_SECONDS=120

summary() { printf '%s\n' "$*" >"${STAGE_SUMMARY:-/dev/stdout}"; }
compose() { docker compose --project-directory "$ROOT" --progress quiet "$@"; }

task_install() {
  (cd "$BACKEND" && uv sync --frozen --quiet)
  (cd "$FRONTEND" && npm ci --no-audit --no-fund --loglevel=error)
  (cd "$FRONTEND" && npx playwright install chromium)
}

# Fails if a host port of a service that is not already running in this compose project
# accepts connections: Docker Desktop can publish over a port another process holds.
check_ports_free() {
  local entry svc port busy=()
  for entry in "backend:$APP_PORT" "frontend:$FRONTEND_PORT" "db:$DB_PORT"; do
    svc="${entry%%:*}"
    port="${entry#*:}"
    [[ -n "$(docker compose --project-directory "$ROOT" ps -q --status running "$svc" 2>/dev/null)" ]] && continue
    if (exec 3<>"/dev/tcp/127.0.0.1/$port") 2>/dev/null; then
      busy+=("$svc (port $port)")
    fi
  done
  if (( ${#busy[@]} > 0 )); then
    printf 'up FAILED: host port already in use for: %s\n' "${busy[*]}"
    return 1
  fi
}

task_up() {
  check_ports_free
  local log
  log="$(mktemp)"
  if compose up -d --build --wait --wait-timeout "$UP_TIMEOUT_SECONDS" >"$log" 2>&1; then
    rm -f "$log"
    printf 'up ok: %s healthy, app %s, api %s\n' "${SERVICES[*]}" "$APP_URL" "$API_URL"
    return 0
  fi
  local unhealthy=() svc health
  for svc in "${SERVICES[@]}"; do
    health="$(docker compose --project-directory "$ROOT" ps -a --format '{{.Health}}' "$svc" 2>/dev/null || true)"
    [[ "$health" == healthy ]] || unhealthy+=("$svc")
  done
  printf 'up FAILED: not healthy within %ss: %s\n' "$UP_TIMEOUT_SECONDS" "${unhealthy[*]:-unknown}"
  grep -iE 'error|unhealthy|port|bind|failed' "$log" | tail -n 20 || tail -n 20 "$log"
  rm -f "$log"
  return 1
}

task_down() {
  compose down --volumes --remove-orphans
}

task_seed() {
  compose exec -T backend python -m app.seed
}

task_openapi() {
  (cd "$BACKEND" && uv run --frozen python -m app.openapi >openapi.json)
  (cd "$FRONTEND" && npx openapi-typescript ../backend/openapi.json -o src/shared/api/schema.d.ts)
}

check_generated_contract() {
  local tmp
  tmp="$(mktemp -d)"
  (cd "$BACKEND" && uv run --frozen python -m app.openapi >"$tmp/openapi.json")
  if ! diff -u "$BACKEND/openapi.json" "$tmp/openapi.json"; then
    echo "backend/openapi.json is out of date with the backend code: run make openapi"
    return 1
  fi
  (cd "$FRONTEND" && npx openapi-typescript ../backend/openapi.json -o "$tmp/schema.d.ts")
  if ! diff -u "$FRONTEND/src/shared/api/schema.d.ts" "$tmp/schema.d.ts"; then
    echo "frontend/src/shared/api/schema.d.ts is out of date with backend/openapi.json: run make openapi"
    return 1
  fi
  rm -rf "$tmp"
}

task_lint() {
  (cd "$BACKEND" && uv run --frozen ruff check --quiet . && uv run --frozen ruff format --check --quiet .)
  (cd "$FRONTEND" && npx eslint . --max-warnings=0 && npx prettier --check --log-level warn .)
  check_generated_contract
}

task_typecheck() {
  (cd "$BACKEND" && uv run --frozen mypy --no-error-summary)
  (cd "$FRONTEND" && npx tsc --noEmit)
}

require_database() {
  if ! (cd "$BACKEND" && uv run --frozen python -m tests.db_ready); then
    return 1
  fi
}

task_test() {
  require_database
  local py_log vt_log
  py_log="$(mktemp)"
  vt_log="$(mktemp)"
  (cd "$BACKEND" && uv run --frozen pytest --cov --cov-report= | tee "$py_log")
  local py_result py_cov
  py_result="$(grep -E '^[0-9]+ passed' "$py_log" | tail -n 1)"
  py_cov="$(cd "$BACKEND" && uv run --frozen coverage report --format=total)"

  (cd "$FRONTEND" && npx vitest run --coverage --reporter=dot | tee "$vt_log")
  local vt_count vt_cov
  vt_count="$(grep -E '^\s+Tests\s' "$vt_log" | sed -E 's/^ +Tests +([0-9]+ passed).*/\1/')"
  vt_cov="$(node -e 'console.log(Math.round(require(process.argv[1]).total.lines.pct))' \
    "$FRONTEND/coverage/coverage-summary.json")"
  rm -f "$py_log" "$vt_log"
  summary "backend ${py_result}, coverage ${py_cov}%; frontend ${vt_count}, coverage ${vt_cov}%"
}

# make test T=<path or test id>: only those tests, no coverage, output straight to the terminal.
task_test_only() {
  local target="$1"
  case "$target" in
    frontend/*) (cd "$FRONTEND" && npx vitest run --reporter=dot "${target#frontend/}") ;;
    *.ts | *.tsx) (cd "$FRONTEND" && npx vitest run --reporter=dot "$target") ;;
    backend/*) (cd "$BACKEND" && uv run --frozen pytest "${target#backend/}") ;;
    *) (cd "$BACKEND" && uv run --frozen pytest "$target") ;;
  esac
}

task_build() {
  compose build backend frontend
}

task_scan() {
  local reqs
  reqs="$(mktemp)"
  (cd "$BACKEND" && uv run --frozen bandit --quiet --recursive app --severity-level medium)
  (cd "$BACKEND" && uv export --frozen --all-groups --no-emit-project --format requirements-txt >"$reqs")
  (cd "$BACKEND" && uv run --frozen pip-audit --requirement "$reqs" --disable-pip --progress-spinner off)
  (cd "$FRONTEND" && npm audit --omit=dev --audit-level=high && npm audit --audit-level=critical)
  rm -f "$reqs"
}

task_e2e() {
  local log
  log="$(mktemp)"
  (cd "$FRONTEND" && npx playwright test ${T:+"${T#frontend/}"} | tee "$log")
  summary "$(grep -E '^\s*[0-9]+ passed' "$log" | tail -n 1 | sed -E 's/^ +//')"
  rm -f "$log"
}

task="${1:?usage: tasks.sh <task>}"
shift
"task_${task//-/_}" "$@"
