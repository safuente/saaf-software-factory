---
feature: F00
project: PRJ-001
reviewer: security
round: 3
verdict: pass
blocking: 0
suggestions: 1
reviewed: feature/F00-project-base @ a7b454b734d55143e6aee4db8c792f636f56ee2e
---

# Security review: F00 Project base

## Round 1

### Findings

#### SEC-1: Database and backend published on all network interfaces with a committed superuser password
- **Severity**: blocking
- **Category**: secrets
- **Location**: `docker-compose.yml:10`, `docker-compose.yml:28`, `docker-compose.yml:35`; `.env.example:14-16`
- **Criterion**: none (spec Security considerations: local-only environment, `.env.example` placeholder credentials "local" only; ADR-002 local-only)
- **Problem**: Every service publishes its port as `"${DB_PORT:-5432}:5432"` (and the same for backend and frontend), which Docker binds to `0.0.0.0` and `[::]`. The database role is the PostgreSQL superuser and its password is the one committed in `.env.example`, which the factory's `.env` keeps unchanged. The "local-only" database is therefore open to anyone on the same network with publicly known credentials.
- **Evidence**: Running stack for this review:
  ```
  $ docker ps --format '{{.Names}} {{.Ports}}'
  lesson-ledger-f00-db-1       0.0.0.0:5501->5432/tcp, [::]:5501->5432/tcp
  lesson-ledger-f00-backend-1  0.0.0.0:8101->8000/tcp, [::]:8101->8000/tcp
  lesson-ledger-f00-frontend-1 0.0.0.0:3101->8080/tcp, [::]:3101->8080/tcp
  $ psql -h 192.168.1.33 -p 5501 -U lessonledger -d lessonledger \
      -Atc "select current_user, rolsuper from pg_roles where rolname=current_user"
  lessonledger|t        # PGPASSWORD=lessonledger-local-only, from .env.example
  ```
  Attack: a developer runs `make up` on shared Wi-Fi (office, café). Another host on the network connects to `<laptop-ip>:<DB_PORT>` with `lessonledger` / `lessonledger-local-only`, gets superuser, and can read or change all data or run `COPY ... TO PROGRAM` for command execution in the db container. From F01 on, this database holds teacher accounts and student names (the spec's personal data).
- **Suggestion**: Bind published ports to loopback, e.g. `"127.0.0.1:${DB_PORT:-5432}:5432"`, and the same for `APP_PORT` and `FRONTEND_PORT`. Add a stack test that checks the published host IP is `127.0.0.1`.

#### SEC-2: Dependency scan blocks only critical npm vulnerabilities
- **Severity**: suggestion
- **Category**: dependencies
- **Location**: `scripts/tasks.sh:145`
- **Criterion**: none
- **Problem**: `npm audit --audit-level=critical` lets high-severity advisories through the gate. pip-audit already fails on any advisory. This meets conventions §5 ("no known critical"). A reachable high-severity issue in a runtime frontend dependency would still pass `make check` unnoticed.
- **Evidence**: Today `npm audit` reports 0 vulnerabilities, so there is no current exploit.
- **Suggestion**: Use `npm audit --omit=dev --audit-level=high` for runtime dependencies. If dev dependencies make that too noisy, keep a separate critical-only check for them.

#### SEC-3: SQLAlchemy errors will log bound parameters
- **Severity**: suggestion
- **Category**: sensitive-logging
- **Location**: `backend/app/core/db.py:10`, `backend/app/core/request_context.py:51`
- **Criterion**: none
- **Problem**: The middleware logs unhandled exceptions with the full trace (`logger.exception`). SQLAlchemy exception messages include `[parameters: ...]` by default. Once F01+ write emails, student names or password hashes, a failing query would put them in the logs, which conventions §5 forbids. F00 runs only `SELECT 1`, so nothing is exposed today.
- **Evidence**: `create_engine(...)` is called without `hide_parameters=True`.
- **Suggestion**: Pass `hide_parameters=True` to `create_engine` in `create_db_engine`, and in `alembic/env.py` too.

### Summary
The application surface is tight. Health endpoints reveal only up or down. Error bodies hold no internals, and a test covers the 500 path. `X-Request-ID` is validated and covered by tests for invalid values. Docs and openapi routes are disabled, CORS is not enabled, nginx sends the required security headers on SPA and `/api` responses (with a stack test), the backend image runs as non-root, and no secrets are committed. The one blocking issue is SEC-1: Docker publishes the database on all interfaces with a known superuser password, which I confirmed by logging in from the LAN address. Tools run: pip-audit found no known vulnerabilities, `npm audit` found 0, and bandit reported 3 low (`assert` type guards, false positives). semgrep is not installed and was not run.

## Round 2

### Previous findings
| Id | Status | Note |
|---|---|---|
| SEC-1 | resolved | `docker-compose.yml` publishes db, backend and frontend on `127.0.0.1:${*_PORT}`. Confirmed on the running stack: `docker ps` shows `127.0.0.1:5501->5432`, `127.0.0.1:8101->8000`, `127.0.0.1:3101->8080`; `nc -z 192.168.1.33 5501/8101/3101` is refused while the same ports on 127.0.0.1 answer (the round 1 LAN login no longer works). Covered by `tests/stack/test_stack.py::test_published_ports_bind_to_loopback_only` and the tightened `test_compose_has_no_container_name_and_no_literal_host_port`. |
| SEC-2 | resolved | `scripts/tasks.sh:145` now runs `npm audit --omit=dev --audit-level=high && npm audit --audit-level=critical`; README updated. |
| SEC-3 | resolved | `hide_parameters=True` in `backend/app/core/db.py` and `backend/alembic/env.py`; `tests/test_db.py` checks a bound value does not appear in the exception text. |

### Findings

#### SEC-4: PostgreSQL error text can still carry input values into logs
- **Severity**: suggestion
- **Category**: sensitive-logging
- **Location**: `backend/app/core/request_context.py:51`
- **Criterion**: none
- **Problem**: Raised by the Builder as an open issue. `hide_parameters` removes SQLAlchemy's `[parameters: ...]` dump, but the driver message from PostgreSQL itself can quote values (e.g. `DETAIL: Key (email)=(x@y.z) already exists.` on a unique violation, or the value in an invalid cast). The middleware logs unhandled exceptions with `logger.exception`, so from F01 on such values could reach logs. F00 has no personal data and runs only `SELECT 1`, so there is no exposure in this feature.
- **Evidence**: No exploit in F00. Decision requested by the Builder: not required for F00. It belongs to F01, which introduces the first personal data (accounts) and should handle known constraint errors (e.g. duplicate email) explicitly before they become unhandled exceptions.
- **Suggestion**: In F01, catch `IntegrityError` for expected constraints and map it to a 409/422 without logging the driver message; for unhandled `DBAPIError`, log the exception class and SQLSTATE (`orig.pgcode`) instead of the full message. The Planner may add this to the F01 spec's Security considerations.

### Summary
All round 1 findings are resolved. SEC-1 is fixed and confirmed against the running stack: the ports refuse connections from the LAN address and are covered by a stack test. The only open item is SEC-4, a suggestion for F01 that answers the Builder's open question about PostgreSQL error text in logs. Dependencies did not change since round 1. The `make check` scan stage (bandit, pip-audit, npm audit) passed on `b835930`, so I did not rerun the scanners. semgrep is not installed and was not run.

## Round 3

### Previous findings
| Id | Status | Note |
|---|---|---|
| SEC-1 | resolved | Unchanged since round 2. Running stack still publishes only on loopback: `127.0.0.1:5501->5432`, `127.0.0.1:8101->8000`, `127.0.0.1:3101->8080`. |
| SEC-2 | resolved | Unchanged since round 2. |
| SEC-3 | resolved | Unchanged since round 2. |
| SEC-4 | open (suggestion) | Deferred to F01, as agreed in round 2. No change expected in F00. |

### Findings
No new findings. The changes since `b835930` (`4a174ca`, `b390a01`, `a7b454b`) answer the Approver's APR-1 and APR-2 and touch only tests (`backend/tests/test_repository.py`, `backend/tests/test_stage.py`), `scripts/acceptance-f00.sh` and one README line. There is no product code, entry point, dependency or configuration change. The new `ac6` acceptance step copies `.env` (local placeholder credentials only) into a `mktemp -d` worktree outside the repo and removes it on exit. The new test reads `PLAN_ADR_DIR` from the developer's environment, and only in tests. Neither adds attack surface.

### Summary
Verdict: pass. Round 3 adds only tests, the acceptance script and docs, with no security impact. SEC-1 to SEC-3 stay resolved, and the only open item is suggestion SEC-4, deferred to F01. Dependencies are unchanged and the `make check` scan stage (bandit, pip-audit, npm audit) passed on `a7b454b`, so I did not rerun the scanners. semgrep is not installed and was not run.
