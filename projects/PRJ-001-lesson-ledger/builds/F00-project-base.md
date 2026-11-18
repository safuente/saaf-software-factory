# Build report: F00 Project base

- Spec: projects/PRJ-001-lesson-ledger/specs/F00-project-base.md (version 1)
- Repo: workspaces/lesson-ledger
- Branch: feature/F00-project-base (base `main`, initial empty commit `e87df94`)
- Mode: base
- Result: complete

## Criteria
| Criterion | Tests | Status |
|---|---|---|
| AC-1 | backend/tests/test_repository.py (`test_ac1_required_path_exists`, `test_ac1_adrs_001_to_004_are_copied`, `test_ac1_env_is_ignored_and_untracked_and_example_is_tracked`, `test_ac1_env_example_lists_every_variable_with_defaults`, `test_ac1_python_version_matches_readme_image_and_toolchain`, `test_ac1_node_version_matches_readme_image_and_toolchain`, `test_ac1_postgresql_version_matches_readme_and_image`, `test_ac1_makefile_defines_and_readme_documents_target`, `test_compose_has_no_container_name_and_no_literal_host_port`, `test_makefile_reads_env`). ADR content identity checked with `diff -r docs/adr <plan>/adr` (identical) | passing |
| AC-2 | backend/tests/test_health.py::test_ac2_health_returns_ok_when_database_reachable, backend/tests/stack/test_stack.py::test_ac2_backend_health_ok; scripts/acceptance-f00.sh `ac2` (all three services healthy, health 200, seed twice, no containers or volumes with the project label after down) and `ac2_port_in_use` | passing |
| AC-3 | scripts/acceptance-f00.sh `ac3` (temporary second worktree with other project name and ports, both up, health and shell on both, `make test` concurrently, second still 200 after first's `make down`) | passing |
| AC-4 | backend/tests/test_health.py: `test_ac4_health_returns_503_when_database_refuses_connections`, `test_ac4_health_answers_within_5s_when_database_host_does_not_answer`, `test_ac4_health_recovers_without_restarting_the_backend` (TCP proxy in front of the real PostgreSQL, cut and restored), `test_health_503_body_reveals_no_database_details`; scripts/acceptance-f00.sh `ac4` (`docker compose stop db`: 503 body in 0.003 s; 200 again after start, backend StartedAt unchanged) | passing |
| AC-5 | frontend/src/app/App.test.tsx, frontend/src/app/indexHtml.test.ts (lang, title, noscript, no inline script/style), frontend/e2e/shell.spec.ts (the single Playwright test), backend/tests/test_health.py::test_ac5_api_health_matches_health, backend/tests/stack/test_stack.py (`test_ac5_frontend_proxies_api_health_unchanged`, `test_ac5_unknown_api_path_through_proxy_is_backend_404`, `test_ac5_client_side_path_returns_shell`, `test_frontend_sends_security_headers`, `test_frontend_does_not_advertise_server_version`, `test_backend_has_no_cors`) | passing |
| AC-6 | backend/tests/test_openapi.py::test_ac6_committed_openapi_schema_matches_code plus the lint-stage diff of both generated files; manual verification below | passing |

Behavior not tied to one criterion: backend/tests/test_errors.py (404, 405, 422, 500 bodies, no stack trace, docs/openapi routes not exposed), backend/tests/test_request_logging.py (X-Request-ID validation, echo, generation, one JSON line per request, exception trace in logs), backend/tests/test_migrations.py (initial revision upgrade, downgrade, re-upgrade; no application tables).

AC-6 manual verification (each change reverted afterwards): `make check` printed 6 lines on success. It failed at `lint FAILED` naming `app/seed.py:12` for an added unused import; at `test FAILED` naming `test_ac2_health_returns_ok_when_database_reachable` for a broken backend assertion; at `test FAILED` naming `src/app/App.test.tsx > ... renders a single h1` for a broken frontend assertion; at `lint FAILED` with a diff of `backend/openapi.json` and "out of date ... run make openapi" for an undocumented schema change. With the stack down, `make lint` passed and `make test` printed `database not reachable at localhost:5501: run \`make up\` first`.

## Checks
| Stage | Command | Result |
|---|---|---|
| Install | `make check` stage 1 (`uv sync --frozen`, `npm ci`, Playwright Chromium) | pass |
| Lint | stage 2: ruff check and format, ESLint, Prettier, OpenAPI and frontend types regenerated and diffed | pass |
| Type check | stage 3: mypy strict, `tsc --noEmit` | pass |
| Tests | stage 4 | pass: backend 63 passed, coverage 95%; frontend 6 passed, coverage 100% |
| Build | stage 5: `docker compose build backend frontend` | pass |
| Scan | stage 6: bandit (medium+), pip-audit (all groups), `npm audit --audit-level=critical` | pass |
| E2E | `make e2e` | pass, 1 passed |
| Environment | `scripts/acceptance-f00.sh all` | pass (AC-2, AC-2 port in use, AC-4, AC-3) |

## Changes
- Versions pinned: Python 3.15.2 (`python:3.15.2-slim`), Node.js 26.13.1 LTS (`node:26.13.1-slim` build stage), PostgreSQL 18.7 (`postgres:18.7-alpine`); frontend served by `nginx:1.30.6-alpine`; uv 0.12.22 copied into the backend build image.
- New dependencies, backend: fastapi, uvicorn, sqlalchemy, psycopg[binary], alembic (ADR-001 stack); dev: pytest, pytest-cov, httpx2 (TestClient and stack tests; Starlette deprecates httpx), ruff, mypy, bandit, pip-audit (ADR-002 gate).
- New dependencies, frontend: react, react-dom; dev: vite, @vitejs/plugin-react, typescript ~5.9 (openapi-typescript 7 requires TS 5), vitest, @vitest/coverage-v8, jsdom, @testing-library/react, @testing-library/jest-dom, @playwright/test, eslint, @eslint/js, typescript-eslint, eslint-plugin-react-hooks, globals, prettier, openapi-typescript, @types/node, @types/react, @types/react-dom.
- Not added: React Router and TanStack Query (ADR-001) are not needed by the shell; the first feature with routes or server state adds them.
- Migrations: `backend/alembic/versions/0001_initial.py` (empty, reversible).
- Extra make target: `make openapi` regenerates `backend/openapi.json` and `frontend/src/shared/api/schema.d.ts`.
- Tests changed rather than added: after the red commit, `test_health.py` and `test_request_logging.py` were reformatted for line length and a header type, and `tests/stack/test_stack.py` switched to `httpx2`; no assertion changed.

## Open issues
- Host Node.js is v24.21.0 while the project pins 26.13.1 (images use 26.13.1). Host tooling works on 24 but `npm ci` warns `EBADENGINE` (hidden by quiet output). Installing Node 26 on the host (e.g. `nvm install 26.13.1`) is a user decision; I did not install tools globally.
- pip-audit has no severity filter, so the backend dependency scan fails on any known vulnerability, stricter than ADR-002's "critical". Lower-severity advisories would block `make check`.
- `make up` checks that no other process listens on `APP_PORT`, `FRONTEND_PORT` or `DB_PORT` before starting. Without this, Docker Desktop on macOS published over a port another process held, so `API_URL` reached the wrong server.
- AC-2, AC-3 and AC-4 are checked by `scripts/acceptance-f00.sh` because they start, stop and tear down containers. It is not part of `make check`. AC-3 creates and removes a temporary git worktree with ports +50 (8151, 3151, 5551), which can be overridden with `SECOND_*_PORT`.
- No rebase was needed: `main` has only the initial commit and there is no remote.

## Fix round 1 (security review, round 1)

- Mode: fix
- Findings: projects/PRJ-001-lesson-ledger/reviews/F00-project-base/security-reviewer.md
- Result: complete
- Branch head: `b835930` (rebase onto `main`: already up to date)

### Findings
| Finding | Action | Commit |
|---|---|---|
| SEC-1 (blocking) ports published on all interfaces with known superuser password | fixed: `docker-compose.yml` binds db, backend and frontend to `127.0.0.1:${*_PORT}`. Reproduced first by `tests/stack/test_stack.py::test_published_ports_bind_to_loopback_only[db,backend,frontend]` (`docker compose port` must report `127.0.0.1`) and by tightening `tests/test_repository.py::test_compose_has_no_container_name_and_no_literal_host_port` to require the `127.0.0.1:` prefix | test `c7aa538`, fix `1dde25d` |
| SEC-2 (suggestion) npm audit blocks only critical | fixed: scan runs `npm audit --omit=dev --audit-level=high` and `npm audit --audit-level=critical` (dev deps stay critical-only); README updated | `c1f1e0e`, docs `b835930` |
| SEC-3 (suggestion) SQLAlchemy errors log bound parameters | fixed: `hide_parameters=True` in `create_db_engine` and `alembic/env.py`. Reproduced first by `tests/test_db.py::test_database_errors_do_not_include_bound_parameters` (failed without the fix, passes with it) | test `c7aa538` + `dcac059`, fix `2a589d3` |

### Checks
| Stage | Command | Result |
|---|---|---|
| Local CI | `make check` | pass: install, lint, typecheck, build, scan ok; backend 67 passed, coverage 95%; frontend 6 passed, coverage 100% |
| E2E | `make e2e` | pass, 1 passed |
| Environment | `scripts/acceptance-f00.sh all` | pass (AC-2, AC-2 port in use, AC-4, AC-3) |

### Changes
- New dependencies: none. Migrations: none.
- Tests changed rather than added: `test_compose_has_no_container_name_and_no_literal_host_port` now also requires loopback binding (SEC-1). `tests/test_db.py` was corrected after its red commit (`dcac059`): the first version cast the value to integer, and PostgreSQL's own error text (`invalid input syntax for type integer: "<value>"`) echoes the value regardless of `hide_parameters`, so it could not go green. It now uses a query against a missing table, which isolates SQLAlchemy's `[parameters: ...]` dump; verified red without the fix.

### Open issues
- `hide_parameters` does not cover PostgreSQL's server error messages, which can quote an offending input value (e.g. invalid type casts, unique violations quote the key in `DETAIL`). The request middleware logs the full exception with `logger.exception`, so from F01 on such values could still reach logs. Validating input before it reaches the database limits this; a log filter that drops the driver message is a broader option. Needs a decision by the Planner or the security reviewer if it should be enforced.

## Fix round: Approver round 2

- Mode: fix
- Findings: projects/PRJ-001-lesson-ledger/reviews/F00-project-base/approval.md
- Result: complete
- Branch head: `a7b454b` (rebase onto `main`: already up to date, merge-base `e87df94`; no remote)

### Findings
| Finding | Action | Commit |
|---|---|---|
| APR-1 (blocking) AC-6 gate behavior has no automated test | fixed, test-only. (1) `backend/tests/test_stage.py`, part of `make test`: `test_ac6_stage_success_prints_one_ok_line_and_hides_command_output`, `test_ac6_stage_success_prints_the_summary_line_when_the_command_writes_one`, `test_ac6_stage_failure_names_the_stage_shows_output_and_keeps_exit_status`, `test_ac6_stage_failure_keeps_only_the_last_200_lines_of_long_output`; verified they fail when `stage.sh` tees output and swallows the exit status. (2) `scripts/acceptance-f00.sh ac6` (also in `all`): in a temporary worktree of HEAD sharing this worktree's `.env` and stack, asserts `make lint` exits 0 printing exactly `lint ok`/`typecheck ok` with the stack down; `make check` with the stack down fails at `test FAILED` pointing to `make up`; with the stack up `make check` exits 0 in at most 12 lines, each a stage summary; then one fault at a time (unused import in `app/seed.py`, broken `test_ac2_health_returns_ok_when_database_reachable`, broken assertion in `App.test.tsx`, `tags=["status"]` without `make openapi`, stale `schema.d.ts`) makes `make check` exit non-zero with `<stage> FAILED` and the file or test name. README line on the acceptance script updated | `b390a01`, `a7b454b` |
| APR-2 (blocking) AC-1 ADR test checks file names, not content | fixed, test-only: `test_ac1_adrs_001_to_004_are_copied` now requires the exact file names; new `test_ac1_adr_content_is_identical_to_the_plan[<file>]` pins each file's SHA-256 to the plan's digest at copy time; new `test_ac1_adrs_match_plan_adr_dir` diffs against `PLAN_ADR_DIR` when set (skipped otherwise; passes with the plan path). Verified red by appending a line to `docs/adr/003-data-model.md` | `4a174ca` |

Both are tests of behavior that already existed, so they went green on their first commit; red was demonstrated by temporary mutation instead (not committed).

### Checks
| Stage | Command | Result |
|---|---|---|
| Local CI | `make check` | pass: install, lint, typecheck, build, scan ok; backend 75 passed, 1 skipped (`PLAN_ADR_DIR` unset), coverage 95%; frontend 6 passed, coverage 100% |
| E2E | `make e2e` | pass, 1 passed |
| Environment | `scripts/acceptance-f00.sh ac6` | pass, 8 checks, 1 min 26 s |

### Changes
- New dependencies: none. Migrations: none. Product code: unchanged.
- Tests changed rather than added: `test_ac1_adrs_001_to_004_are_copied` asserts full file names instead of 3-character prefixes (APR-2).

### Open issues
- `acceptance-f00.sh ac6` runs `make check` in the temporary worktree with this worktree's `COMPOSE_PROJECT_NAME`, because `tests/stack/test_stack.py` resolves ports with `docker compose port`. Its build stage therefore re-tags this project's `backend`/`frontend` images from HEAD; it never runs `up` or `down` there. It does run `make down`/`make up` in this worktree.
