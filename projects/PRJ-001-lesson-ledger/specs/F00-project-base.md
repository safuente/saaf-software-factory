---
id: F00
project: PRJ-001
entry: projects/PRJ-001-lesson-ledger/plan/backlog/F00-project-base.md
status: approved
version: 1
touches_frontend: true
adrs: [ADR-001, ADR-002, ADR-004]
---

# Project base

## Summary
Creates the Lesson Ledger repository at `workspaces/lesson-ledger` with the FastAPI + React + PostgreSQL stack of ADR-001 and the local-only environment and gate of ADR-002. After this ships, any developer or factory agent can start an isolated stack per worktree with `make up`, open an empty "Lesson Ledger" shell at `APP_URL`, and run the full local CI with `make check` and `make e2e`. No business feature exists yet.

## Acceptance criteria
- **AC-1**: Given a fresh clone of the repository, when its contents are inspected, then it contains `backend/`, `frontend/`, `docs/adr/` with ADR-001 to ADR-004 identical in content to the project plan's `plan/adr/`, `docker-compose.yml`, `Makefile`, `CLAUDE.md`, `README.md` and a committed `.env.example`; `.env` is listed in `.gitignore` and not tracked; the README lists the exact Python, Node.js and PostgreSQL versions (full `x.y.z` for Python and Node.js, `x.y` for PostgreSQL) and these equal the versions used by the Docker images and the toolchain configuration; the README documents every Makefile target listed in Behavior.
- **AC-2**: Given a `.env` copied from `.env.example`, when `make up` runs, then it exits 0 only after the `db`, `backend` and `frontend` services all report healthy; `GET {API_URL}/health` returns 200 with body `{"status": "ok"}`; `make seed` run twice in a row exits 0 both times; and after `make down`, `docker ps -a` and `docker volume ls` filtered by label `com.docker.compose.project=<COMPOSE_PROJECT_NAME>` both return nothing.
- **AC-3**: Given two worktrees whose `.env` files differ in `COMPOSE_PROJECT_NAME`, `APP_PORT`, `FRONTEND_PORT`, `DB_PORT`, `APP_URL` and `API_URL`, when `make up` runs in both, then both exit 0, each worktree's `GET {API_URL}/health` returns 200 and each `APP_URL` shows the shell; `make test` passes in both when run at the same time; and after `make down` in the first, the second's `GET {API_URL}/health` still returns 200.
- **AC-4**: Given the stack is up, when the `db` service is stopped (`docker compose stop db`), then `GET {API_URL}/health` responds within 5 s with 503 and body `{"error": {"code": "database_unavailable", "message": "Database is not reachable", "details": {}}}`; when `db` is started again, `GET {API_URL}/health` returns 200 within 30 s without restarting the backend.
- **AC-5**: Given the stack is up, when a browser opens `APP_URL`, then the page has document title "Lesson Ledger", a single `h1` with text "Lesson Ledger" inside a `main` landmark, and `html lang="en"`; `GET {APP_URL}/api/health` returns the same status and body as `GET {API_URL}/health`; `GET {APP_URL}/any/client/path` returns 200 with the same shell; and `make e2e` exits 0 running one Playwright test that opens `APP_URL` and finds that `h1`.
- **AC-6**: Given the stack is up after `make install`, when `make lint` and `make check` run, then both exit 0, `make lint` succeeds even with the stack down, and `make check` prints at most 12 lines in total (one summary line per stage on success, no progress bars or per-test lines); and when a lint error, a failing backend or frontend test, or a backend API change not reflected in the committed OpenAPI schema is introduced, `make check` exits non-zero and its output names the failing stage and the offending file or test.

## Behavior
- **Makefile targets**: `install`, `up`, `down`, `seed`, `lint`, `test` (with `T=<path or test id>` to run only those tests, without coverage), `e2e` (with `T=<spec file>`), `check`, as defined in `policies/conventions.md` §2. The Makefile reads `.env` (`-include .env` and `export`).
- **`make check` stages, in order** (ADR-002): 1 install from lock files; 2 lint and format check (backend and frontend); 3 type check (backend strict, frontend `tsc --noEmit`); 4 backend and frontend tests with coverage; 5 Docker image build for `backend` and `frontend`; 6 security scan (Python SAST plus dependency vulnerability scans for backend and frontend). The first failing stage stops the run.
- **`make check` needs the stack up**, like `make test`. If the worktree's database is not reachable, the test stage fails with a single line telling the user to run `make up`, not with a traceback.
- **OpenAPI contract** (ADR-001): the backend's OpenAPI schema is generated from the backend code and committed. Frontend API types are generated from the committed schema and committed. `make check` (lint stage) fails if regenerating either produces a difference. README and `CLAUDE.md` state the command that regenerates both.
- **Coverage**: each test suite prints its coverage percentage in its summary line. Default chosen: F00 enforces no minimum threshold; it only reports the baseline later features must not lower.
- **Security scan thresholds**: dependency scans fail on any vulnerability of critical severity (ADR-002). Default chosen: SAST fails on any finding of medium or higher severity.
- **Quiet output**: every target follows conventions §2 "Quiet output". On success `make up`, `make down`, `make seed`, `make install` and `make lint` print at most one line per stage; `make e2e` prints at most 5 lines.
- **`make up` failure**: if a service does not become healthy within 120 s, or a host port is already in use, `make up` exits non-zero and prints the failing service name.
- **Configuration**: every host port and URL comes from `.env`. `.env.example` contains `COMPOSE_PROJECT_NAME`, `APP_PORT`, `FRONTEND_PORT`, `DB_PORT`, `REDIS_PORT`, `APP_URL`, `API_URL` and the database credentials, with defaults `APP_PORT=8000`, `FRONTEND_PORT=3000`, `DB_PORT=5432`, `APP_URL=http://localhost:3000`, `API_URL=http://localhost:8000`. `docker-compose.yml` has no `container_name` and no literal host port. `REDIS_PORT` is listed but unused (ADR-001: no Redis).
- **URLs** (ADR-002): `APP_URL` is the frontend origin, used by Playwright. `API_URL` is the backend base URL, used by backend API tests and tooling. The frontend server forwards every `/api/*` request to the backend with the path unchanged.
- **Health**: `GET /health` checks the database on every call. Default chosen: the same endpoint is also exposed as `GET /api/health`, so reachability through the same-origin proxy can be checked before any business endpoint exists. Neither requires a session (ADR-004).
- **Backend errors**: every backend error response, including unknown routes (404), wrong method (405), request validation (422) and unhandled exceptions (500), uses the conventions §4 error body. 500 responses carry no stack trace or exception text. Default codes: `not_found`, `method_not_allowed`, `validation_error`, `internal_error`, `database_unavailable`.
- **Client-side routes**: any `GET` path not under `/api/` and not a built static asset returns 200 with the shell, so later features can add routes.
- **Database schema**: schema migrations are set up and applied when the backend starts (ADR-002). F00 creates no application tables. The initial migration applies and reverts cleanly.
- **Seed**: `make seed` exists, is idempotent and loads no data in F00 (there are no entities yet). It exits 0 and prints one line. The README's seed section states that test users are added by F01. This narrows ADR-002's "at least two teachers" until F01.
- **Logging** (ADR-001, conventions §6): backend logs are JSON lines to stdout, one per request, with `request_id`, method, path, status code and duration in ms. Default chosen: a request id is read from the `X-Request-ID` request header if it is 1 to 64 characters of `[A-Za-z0-9._-]`, otherwise generated; it is returned in the `X-Request-ID` response header.
- **Versions** (ADR-001): latest stable Python, current Node.js LTS and latest stable PostgreSQL at build time, pinned exactly in images and toolchain configuration.
- **`CLAUDE.md`** states for agents: the Makefile targets to use, the backend and frontend layout per conventions §2, the OpenAPI regeneration rule, and that ports and URLs come only from `.env`.

## Interfaces

### API
- `GET /health` and `GET /api/health` (no auth)
  - 200 `{"status": "ok"}` when the database answers.
  - 503 `{"error": {"code": "database_unavailable", "message": "Database is not reachable", "details": {}}}` when it does not, within 5 s.
- Any other path under `/api/` → 404 `{"error": {"code": "not_found", "message": "Not found", "details": {}}}`.
- Response header on every backend response: `X-Request-ID`.
- OpenAPI schema generated from the backend and committed; it contains the health endpoints only.

### Data model
None. Schema migration tooling with an empty initial revision; no tables.

### Configuration
`.env` variables as listed in Behavior. `.env.example` committed, `.env` git-ignored.

## UI
Single screen: application shell at `APP_URL` (and any client-side path).

- **Success**: document title "Lesson Ledger", `html lang="en"`, a `main` landmark containing one `h1` "Lesson Ledger". No navigation, no data.
- **Loading**: the served HTML already contains the document title; no spinner. The shell does not call the backend, so it has no data-loading state.
- **Empty**: not applicable; the shell shows no data.
- **Error**: backend or database down does not affect the shell, which renders the same. A `noscript` message reads "Lesson Ledger needs JavaScript enabled."
- **No permission**: not applicable; there are no accounts until F01.

## Security considerations
- **Access**: no authentication exists yet. The only backend endpoints are the health checks, which are public by design (ADR-004) and reveal only up/down status: no versions, hostnames or database error text.
- **User input**: request paths and headers only. `X-Request-ID` is validated (Behavior) before being logged or echoed, to prevent log injection and header injection.
- **Data leaving the system**: health status and the static shell. No personal data exists. Error bodies never include stack traces or exception messages.
- **CORS**: not enabled on the backend; the browser uses the same origin through the frontend proxy (ADR-002, ADR-004).
- **Security headers**: responses from `APP_URL` include `X-Content-Type-Options: nosniff`, `Referrer-Policy: same-origin` and `Content-Security-Policy` with at least `default-src 'self'; frame-ancestors 'none'` (conventions §5).
- **Secrets**: none committed. `.env.example` holds placeholder local database credentials only; `.env` is ignored; images contain no credentials, which are injected at runtime from `.env`.
- **Supply chain**: dependencies installed only from lock files; the scan stage of `make check` blocks critical vulnerabilities. The scanners need network access (plan Risks).

## Non-functional
- Accessibility: the shell meets WCAG 2.1 AA (`questions.md` A11): language set, title, one `h1`, `main` landmark, text contrast at least 4.5:1.
- `make up` from cached images completes within 120 s, or fails (Behavior).
- `GET /health` responds within 5 s in every case.

## Out of scope
- Any business feature: accounts, students, lessons, summaries.
- Hosted CI and any remote or production environment (ADR-002). No CI platform pipeline file.
- Visual design beyond a minimal accessible shell.
- Seed users and data (added by F01 onward).
- Coverage thresholds (Behavior).
- Redis or any service other than `db`, `backend`, `frontend`.

## Traceability
| Expected result | Criteria |
|---|---|
| Repository with backend, frontend and docs layout, ADRs copied, README, agent notes | AC-1 |
| `make up` healthy per `COMPOSE_PROJECT_NAME`, `make down` removes containers and volumes, two worktrees side by side | AC-2, AC-3 |
| Health 200 with database reachable; `APP_URL` shows "Lesson Ledger" shell reaching the backend through the same origin | AC-2, AC-4, AC-5 |
| `make check` passes quietly running all local CI stages | AC-6 |
| `make e2e` passes with one smoke test | AC-5 |
| `make install`, `make seed` (idempotent), `make lint` succeed; committed OpenAPI schema generated from the backend | AC-2, AC-6 |

## Open questions
None.

## Changelog
