#!/usr/bin/env bash
# Environment-level acceptance checks for F00 (AC-2, AC-3, AC-4, AC-6).
# They start, stop and tear down Docker services, so they are not part of `make check`.
#
# Usage: scripts/acceptance-f00.sh [ac2|ac3|ac4|ac6|all]
# AC-3 creates a temporary second worktree; its ports come from SECOND_APP_PORT,
# SECOND_FRONTEND_PORT and SECOND_DB_PORT (defaults: this worktree's ports + 50).
# AC-6 runs `make check` in a temporary worktree of HEAD that shares this worktree's .env and
# stack (it never runs up or down there), injecting one fault at a time.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
set -a
# shellcheck disable=SC1091
source .env
set +a

pass() { printf 'PASS %s\n' "$1"; }
fail() { printf 'FAIL %s\n' "$1" >&2; exit 1; }

status_of() { curl -s -o /dev/null -w '%{http_code}' --max-time 10 "$1"; }
body_of() { curl -s --max-time 10 "$1"; }

project_leftovers() {
  local label="label=com.docker.compose.project=$1"
  docker ps -aq --filter "$label"
  docker volume ls -q --filter "$label"
}

ac2() {
  make up >/dev/null || fail "AC-2 make up"
  for svc in db backend frontend; do
    [[ "$(docker compose ps --format '{{.Health}}' "$svc")" == healthy ]] || fail "AC-2 $svc healthy"
  done
  [[ "$(status_of "$API_URL/health")" == 200 ]] || fail "AC-2 health status"
  [[ "$(body_of "$API_URL/health")" == '{"status":"ok"}' ]] || fail "AC-2 health body"
  make seed >/dev/null || fail "AC-2 first seed"
  make seed >/dev/null || fail "AC-2 second seed"
  make down >/dev/null || fail "AC-2 make down"
  [[ -z "$(project_leftovers "$COMPOSE_PROJECT_NAME")" ]] || fail "AC-2 leftovers after down"
  pass "AC-2 up healthy, health 200, seed twice, down leaves nothing"
}

ac2_port_in_use() {
  make down >/dev/null
  python3 -c "import socket, time
s = socket.socket(); s.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
s.bind(('0.0.0.0', $APP_PORT)); s.listen(); time.sleep(30)" &
  local holder=$!
  disown "$holder"
  sleep 1
  local out
  if out="$(make up 2>&1)"; then
    kill "$holder"; make down >/dev/null; fail "AC-2 make up succeeded with APP_PORT taken"
  fi
  kill "$holder"
  grep -q backend <<<"$out" || fail "AC-2 port failure does not name the service: $out"
  make down >/dev/null
  pass "AC-2 make up fails naming backend when APP_PORT is taken"
}

ac4() {
  make up >/dev/null || fail "AC-4 make up"
  local backend_started
  backend_started="$(docker inspect -f '{{.State.StartedAt}}' "$(docker compose ps -q backend)")"
  docker compose stop db >/dev/null 2>&1

  local start end code body
  start=$(date +%s)
  code="$(status_of "$API_URL/health")"
  body="$(body_of "$API_URL/health")"
  end=$(date +%s)
  [[ "$code" == 503 ]] || fail "AC-4 status with db stopped: $code"
  [[ "$body" == '{"error":{"code":"database_unavailable","message":"Database is not reachable","details":{}}}' ]] \
    || fail "AC-4 body with db stopped: $body"
  (( end - start < 10 )) || fail "AC-4 two calls took $((end - start))s"
  local single
  single="$(curl -s -o /dev/null -w '%{time_total}' --max-time 10 "$API_URL/health")"
  awk -v t="$single" 'BEGIN { exit !(t < 5) }' || fail "AC-4 503 took ${single}s"

  docker compose start db >/dev/null 2>&1
  local deadline=$(( $(date +%s) + 30 ))
  until [[ "$(status_of "$API_URL/health")" == 200 ]]; do
    (( $(date +%s) < deadline )) || fail "AC-4 no 200 within 30s of db start"
    sleep 1
  done
  [[ "$(docker inspect -f '{{.State.StartedAt}}' "$(docker compose ps -q backend)")" == "$backend_started" ]] \
    || fail "AC-4 backend was restarted"
  make down >/dev/null
  pass "AC-4 503 in ${single}s with db stopped, 200 again after db start, backend not restarted"
}

ac3() {
  local second
  second="$(mktemp -d)/second"
  git worktree add -q --detach "$second" HEAD
  local second_project="${COMPOSE_PROJECT_NAME}-ac3"
  local sa="${SECOND_APP_PORT:-$((APP_PORT + 50))}"
  local sf="${SECOND_FRONTEND_PORT:-$((FRONTEND_PORT + 50))}"
  local sd="${SECOND_DB_PORT:-$((DB_PORT + 50))}"
  sed -e "s|^COMPOSE_PROJECT_NAME=.*|COMPOSE_PROJECT_NAME=$second_project|" \
      -e "s|^APP_PORT=.*|APP_PORT=$sa|" -e "s|^FRONTEND_PORT=.*|FRONTEND_PORT=$sf|" \
      -e "s|^DB_PORT=.*|DB_PORT=$sd|" \
      -e "s|^APP_URL=.*|APP_URL=http://localhost:$sf|" -e "s|^API_URL=.*|API_URL=http://localhost:$sa|" \
      .env > "$second/.env"
  # shellcheck disable=SC2064
  trap "make -C '$ROOT' down >/dev/null 2>&1; make -C '$second' down >/dev/null 2>&1; git -C '$ROOT' worktree remove --force '$second'" EXIT

  make install >/dev/null || fail "AC-3 install first"
  make -C "$second" install >/dev/null || fail "AC-3 install second"
  make up >/dev/null || fail "AC-3 up first"
  make -C "$second" up >/dev/null || fail "AC-3 up second"

  for url in "$API_URL" "http://localhost:$sa"; do
    [[ "$(status_of "$url/health")" == 200 ]] || fail "AC-3 health at $url"
  done
  for url in "$APP_URL" "http://localhost:$sf"; do
    body_of "$url/" | grep -q '<title>Lesson Ledger</title>' || fail "AC-3 shell at $url"
  done

  local log1 log2
  log1="$(mktemp)"; log2="$(mktemp)"
  make test >"$log1" 2>&1 & local p1=$!
  make -C "$second" test >"$log2" 2>&1 & local p2=$!
  wait "$p1" || { cat "$log1"; fail "AC-3 make test first"; }
  wait "$p2" || { cat "$log2"; fail "AC-3 make test second"; }

  make down >/dev/null
  [[ "$(status_of "http://localhost:$sa/health")" == 200 ]] || fail "AC-3 second down after first make down"
  pass "AC-3 two worktrees up side by side, make test concurrently, second survives first's down"
}

# AC-6: runs `make check` in $AC6_DIR and asserts it fails, naming the stage and the file or test.
ac6_expect_check_fails() {
  local what="$1" stage="$2" needle="$3" out
  if out="$(make -C "$AC6_DIR" check 2>&1)"; then
    fail "AC-6 make check passed with $what"
  fi
  grep -q "^$stage FAILED\$" <<<"$out" || fail "AC-6 $what: no '$stage FAILED' line: $out"
  grep -qF "$needle" <<<"$out" || fail "AC-6 $what: output does not name '$needle': $out"
  git -C "$AC6_DIR" checkout -q -- .
  pass "AC-6 $what: make check fails at $stage naming $needle"
}

ac6() {
  AC6_DIR="$(mktemp -d)/ac6"
  git worktree add -q --detach "$AC6_DIR" HEAD
  cp .env "$AC6_DIR/.env"
  # shellcheck disable=SC2064
  trap "make -C '$ROOT' down >/dev/null 2>&1; git -C '$ROOT' worktree remove --force '$AC6_DIR'" EXIT

  make down >/dev/null || fail "AC-6 make down"
  make -C "$AC6_DIR" install >/dev/null || fail "AC-6 install"
  local out
  out="$(make -C "$AC6_DIR" lint 2>&1)" || fail "AC-6 make lint with the stack down: $out"
  [[ "$out" == $'lint ok\ntypecheck ok' ]] || fail "AC-6 make lint output: $out"
  pass "AC-6 make lint succeeds with the stack down"
  if out="$(make -C "$AC6_DIR" check 2>&1)"; then
    fail "AC-6 make check passed with the stack down"
  fi
  grep -q '^test FAILED$' <<<"$out" && grep -q 'make up' <<<"$out" \
    || fail "AC-6 make check with the stack down does not point to make up: $out"
  pass "AC-6 make check with the stack down fails at test telling to run make up"

  make up >/dev/null || fail "AC-6 make up"
  out="$(make -C "$AC6_DIR" check 2>&1)" || fail "AC-6 make check: $out"
  local lines
  lines="$(wc -l <<<"$out" | tr -d ' ')"
  (( lines <= 12 )) || fail "AC-6 make check printed $lines lines: $out"
  grep -vqE '^(install|lint|typecheck|test|build|scan)( ok|: .+)$' <<<"$out" \
    && fail "AC-6 make check printed a line that is not a stage summary: $out"
  pass "AC-6 make check passes in $lines lines, one summary per stage"

  { echo 'import os'; cat "$AC6_DIR/backend/app/seed.py"; } >"$AC6_DIR/seed.tmp"
  mv "$AC6_DIR/seed.tmp" "$AC6_DIR/backend/app/seed.py"
  ac6_expect_check_fails "an unused import" lint "app/seed.py"

  perl -0pi -e 's/(def test_ac2_health_returns_ok_when_database_reachable.*?status_code == )200/${1}201/s' \
    "$AC6_DIR/backend/tests/test_health.py"
  ac6_expect_check_fails "a failing backend test" test "test_ac2_health_returns_ok_when_database_reachable"

  perl -pi -e 's/toHaveLength\(1\)/toHaveLength(2)/' "$AC6_DIR/frontend/src/app/App.test.tsx"
  ac6_expect_check_fails "a failing frontend test" test "App.test.tsx"

  perl -pi -e 's/tags=\["health"\]/tags=["status"]/' "$AC6_DIR/backend/app/health/router.py"
  ac6_expect_check_fails "an API change without make openapi" lint "backend/openapi.json is out of date"

  echo 'export type Stale = 1;' >>"$AC6_DIR/frontend/src/shared/api/schema.d.ts"
  ac6_expect_check_fails "stale frontend API types" lint "schema.d.ts is out of date"

  make down >/dev/null
  git worktree remove --force "$AC6_DIR"
  trap - EXIT
}

case "${1:-all}" in
  ac2) ac2; ac2_port_in_use ;;
  ac3) ac3 ;;
  ac4) ac4 ;;
  ac6) ac6 ;;
  all) ac2; ac2_port_in_use; ac4; ac6; ac3 ;;
  *) echo "usage: $0 [ac2|ac3|ac4|ac6|all]" >&2; exit 2 ;;
esac
