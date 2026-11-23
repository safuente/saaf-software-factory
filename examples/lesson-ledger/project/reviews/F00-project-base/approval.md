---
feature: F00
project: PRJ-001
round: 3
decision: approved
route_to: human-merge
reviewed: feature/F00-project-base @ a7b454b734d55143e6aee4db8c792f636f56ee2e
spec_version: 1
---

# Approval: F00 Project base

## Round 2

First Approver round for this feature (pipeline round 2: round 1 was the security fix loop).

### Preconditions
| Check | Result |
|---|---|
| Security review | pass, round 2 @ `b835930` (head) |
| Code review | pass, round 2 @ `b835930` (head) |
| UX review | pass @ `ddfc3e5`; `git diff ddfc3e5..b835930` touches no file under `frontend/`, not stale |
| UI review | pass @ `ddfc3e5`; same, not stale |
| Spec | `status: approved`, version 1 = build report version 1 |
| Checks (`make check`, `make e2e`) | pass @ `b83593059c774859cf91c3285c75adf06c854265` (= head) |

Independent checks of the environment criteria (AC-2, AC-3, AC-4, AC-6 failure paths) were run in a fresh `git clone` of the branch in a scratch directory, with its own `.env` (`COMPOSE_PROJECT_NAME=ll-approver-f00`, ports 8191/3191/5591), so the shared stack `lesson-ledger-f00` (8101/3101/5501) was never stopped, reseeded or modified. The clone's containers, volumes and images were removed afterwards.

### Acceptance criteria
| Criterion | Tests | Independent check | Result |
|---|---|---|---|
| AC-1 | `backend/tests/test_repository.py::test_ac1_*` (paths, `.env` ignored/untracked, `.env.example` defaults, Python/Node/PostgreSQL versions vs README/images/toolchain, Makefile targets documented) | Fresh clone: all paths present; `git status` clean with `.env` created (ignored); `diff -r docs/adr <factory>/projects/PRJ-001-lesson-ledger/plan/adr` → identical; README versions 3.15.2 / 26.13.1 / 18.7 equal `backend/.python-version`, `requires-python ==3.15.2`, `python:3.15.2-slim`, `frontend/.nvmrc`, `engines.node`, `node:26.13.1-slim`, `postgres:18.7-alpine`; README documents install, up, down, seed, lint, test (with `T=`), e2e (with `T=`), check | weak-tests: see APR-2 |
| AC-2 | `test_health.py::test_ac2_health_returns_ok_when_database_reachable`, `tests/stack/test_stack.py::test_ac2_backend_health_ok`, `scripts/acceptance-f00.sh ac2` / `ac2_port_in_use` | Clone: `make up` → `up ok: db backend frontend healthy ...`, exit 0 in 15.7 s; `docker compose ps` all `healthy`, ports on `127.0.0.1`; `GET :8191/health` → 200 `{"status":"ok"}`; `make seed` twice → exit 0, one line each; `make down` → `down ok`; `docker ps -aq` and `docker volume ls -q` with `label=com.docker.compose.project=ll-approver-f00` → both empty. Port taken (listener on 127.0.0.1:8191): `make up` → `up FAILED: host port already in use for: backend (port 8191)`, exit 2, no containers created | pass |
| AC-3 | `scripts/acceptance-f00.sh ac3` | Clone stack (8191/3191) up alongside shared stack (8101/3101): both `/health` 200, both `APP_URL` serve `<title>Lesson Ledger</title>`; `make test T=tests/test_health.py` run concurrently in both → `6 passed` each, exit 0; after `make down` in the clone, shared `GET :8101/health` → 200 `{"status":"ok"}` | pass |
| AC-4 | `test_health.py::test_ac4_health_returns_503_when_database_refuses_connections`, `test_ac4_health_answers_within_5s_when_database_host_does_not_answer`, `test_ac4_health_recovers_without_restarting_the_backend`, `scripts/acceptance-f00.sh ac4` | Clone: `docker compose stop db` → `GET /health` 503 `{"error":{"code":"database_unavailable","message":"Database is not reachable","details":{}}}` in 0.010 s and 0.004 s; same through `APP_URL/api/health`; shell still 200. `docker compose start db` → 200 after 2 s; backend `StartedAt` unchanged (`2026-11-17T14:26:56.22223301Z`) | pass |
| AC-5 | `frontend/e2e/shell.spec.ts` (single Playwright test), `frontend/src/app/App.test.tsx`, `frontend/src/app/indexHtml.test.ts`, `test_health.py::test_ac5_api_health_matches_health`, `tests/stack/test_stack.py::test_ac5_*` | Playwright on `http://localhost:3101/` and `/any/client/path`: title "Lesson Ledger", `lang="en"`, one `main`, one `h1` "Lesson Ledger" inside it (screenshot `/private/tmp/claude-501/-Users-saaf-workspace-saaf-software-factory/1970f24f-a397-48d4-a233-ca6562813eac/scratchpad/shell_.png`); `GET :3101/api/health` = `GET :8101/health` = 200 `{"status":"ok"}`; `GET :3101/any/client/path` 200, byte-identical to `/`; clone `make e2e` → `e2e: 1 passed (597ms)`, exit 0 | pass |
| AC-6 | `backend/tests/test_openapi.py::test_ac6_committed_openapi_schema_matches_code` only | Clone: `make check` success → 6 lines, exit 0. Unused `import os` in `app/seed.py` → exit 2, `lint FAILED` naming `app/seed.py:1:1`. `tags=["status"]` in health router → exit 2, `lint FAILED`, `backend/openapi.json is out of date with the backend code: run make openapi`. Backend assertion broken → exit 2, `test FAILED` naming `test_ac2_health_returns_ok_when_database_reachable`. Frontend assertion broken → exit 2, `test FAILED` naming `src/app/App.test.tsx > AC-5 application shell > renders a single h1 ...`. Stack down: `make lint` → `lint ok`, `typecheck ok`, exit 0; `make check` → `test FAILED` + `database not reachable at localhost:5591: run \`make up\` first` | weak-tests: see APR-1 |

Behavior and Security considerations spot checks (all pass, against the shared stack): `GET :8101/api/nope` and `GET :3101/api/nope` → 404 `not_found` body; `POST /health` → 405 `method_not_allowed` body; `/docs`, `/openapi.json` → 404; `X-Request-ID: abc.DEF_1-2` echoed, `bad id;<x>` and a 65-char value replaced by a generated id; every backend response carries `X-Request-ID`; `APP_URL` responses (`/`, client path, `/api/health`) carry `X-Content-Type-Options: nosniff`, `Referrer-Policy: same-origin`, `Content-Security-Policy: default-src 'self'; frame-ancestors 'none'; ...`; `noscript` text "Lesson Ledger needs JavaScript enabled."; backend logs are JSON lines with `request_id`, `method`, `path`, `status_code`, `duration_ms`; `docker-compose.yml` has no `container_name` and only `127.0.0.1:${*_PORT}` host ports; `.env.example` defaults match the spec. 500 path, 422 and migration up/down/up are covered by `test_errors.py` and `test_migrations.py` (passing in the checks file) and not observable from outside in F00.

### Definition of done
| Item | Result |
|---|---|
| Every criterion has tests referencing its id | fail: AC-6 and the AC-1 ADR clause are referenced but covered only in part (APR-1, APR-2) |
| CI stages pass locally | pass (`make check`, `make e2e` @ head) |
| Branch rebased on base; migrations apply after base's | pass (merge-base = `main` = `e87df94`) |
| Migrations included and reversible | pass (`0001_initial.py`, `test_migrations.py`) |
| `make seed` reaches every UI state | pass (shell needs no data; success and `noscript` states need none) |
| README updated if setup changed | pass |
| No TODOs without a backlog item | pass (`git grep -iE 'TODO|FIXME'` at head: none) |

### Findings

#### APR-1: AC-6 gate behavior has no automated test
- **Severity**: blocking
- **Category**: criterion-not-met
- **Location**: `backend/tests/test_openapi.py`, `scripts/stage.sh`, `scripts/tasks.sh`, `scripts/acceptance-f00.sh`
- **Criterion**: AC-6
- **Problem**: The behavior is correct (verified above), but the only test that references AC-6 checks that the committed OpenAPI schema matches the code. Nothing automated checks the rest of the criterion: `make lint` succeeds with the stack down, `make check` prints at most 12 lines on success, and a lint error, a failing backend test, a failing frontend test, or a stale OpenAPI schema/frontend types makes `make check` exit non-zero naming the stage and the file or test. The build report records these as manual checks. A later change to `stage.sh` or `tasks.sh` (e.g. dropping output capture, or swallowing an exit status) would break the gate without any test failing.
- **Evidence**: `git grep -n -iE 'ac[-_]?6' -- backend frontend scripts` → only `backend/tests/test_openapi.py:11`. The manual steps in the build report ("AC-6 manual verification") and in the AC-6 row above are not in any test or script.
- **Suggestion**: Add an `ac6` function to `scripts/acceptance-f00.sh` (same pattern as `ac3`: temporary worktree, stack up) that runs `make check` and asserts exit 0 and `wc -l` ≤ 12; then, one at a time in the temporary worktree, injects an unused import, a broken backend assertion, a broken frontend assertion and an API change without `make openapi`, and asserts non-zero exit plus `<stage> FAILED` and the file or test name in the output; and runs `make lint` with the stack down and asserts exit 0. Optionally, unit-test `scripts/stage.sh` directly from pytest (success prints one `<label> ok` line; failure prints `<label> FAILED` and the captured output and keeps the exit status). Name the checks with `AC-6`.

#### APR-2: AC-1 ADR test checks file names, not content
- **Severity**: blocking
- **Category**: criterion-not-met
- **Location**: `backend/tests/test_repository.py:74`
- **Criterion**: AC-1
- **Problem**: AC-1 requires `docs/adr/` to hold ADR-001 to ADR-004 "identical in content to the project plan's `plan/adr/`". `test_ac1_adrs_001_to_004_are_copied` only asserts that the file names start with `001`..`004`; an empty or edited ADR passes. Content identity was checked once by hand (build report: `diff -r`). The content is currently identical (`diff -r` clean).
- **Evidence**: `backend/tests/test_repository.py:74-77`: `assert [n[:3] for n in names] == ["001", "002", "003", "004"]`.
- **Suggestion**: The plan directory is outside the repo, so pin the content: assert the SHA-256 of each `docs/adr/00N-*.md` equals the digest of the plan's file at copy time (record the four digests in the test). Optionally, when an env var such as `PLAN_ADR_DIR` is set, also `diff` against it directly.

### Decision
Rejected, back to the Builder. The software meets all six criteria and the spot-checked Behavior and Security rules, but AC-6 (APR-1) and the content clause of AC-1 (APR-2) are covered only by manual checks, so a regression in the gate or in the copied ADRs would go unnoticed. Both fixes are test-only; no product code needs to change.

## Round 3 (precondition check)

### Preconditions
| Check | Result |
|---|---|
| Security review | pass, round 3 @ `a7b454b` (head) |
| Code review | **fail: stale.** Latest round is 2 @ `b835930`; head is `a7b454b`. `git diff --stat b835930..a7b454b` changes `README.md`, `backend/tests/test_repository.py`, `backend/tests/test_stage.py` (new), `scripts/acceptance-f00.sh` (+74/-6) in commits `4a174ca`, `b390a01`, `a7b454b` |
| UX review | pass @ `ddfc3e5`; `git diff --name-only ddfc3e5..a7b454b -- frontend/` is empty, not stale |
| UI review | pass @ `ddfc3e5`; same, not stale |
| Spec | `status: approved`, version 1 = build report version 1 |
| Checks (`make check`, `make e2e`) | pass @ `a7b454b734d55143e6aee4db8c792f636f56ee2e` (= head) |
| Branch on base | merge-base = `main` = `e87df94` |

Precondition failed, so the acceptance criteria were not verified this round (APR-1 and APR-2 stay open until verified on a reviewed head).

### Findings
No new findings. APR-1 and APR-2: not re-verified this round; the Builder's fixes (`4a174ca`, `b390a01`, `a7b454b`) are pending code review.

### Decision
Rejected, routed to the code reviewer. The round-3 fixes for APR-1 and APR-2 add a new test module and 74 lines to `scripts/acceptance-f00.sh` that the code reviewer has not seen; only the security reviewer re-reviewed head. Not escalated despite round 3: this is a missing review step, not a failure to converge, and no criterion has been found failing since round 2. After the code reviewer passes `a7b454b` (or a later head), re-run the Approver; if APR-1 or APR-2 is still not met then, round 4 escalates to a human.

## Round 3 (re-run after code review)

### Preconditions
| Check | Result |
|---|---|
| Security review | pass, round 3 @ `a7b454b` (head) |
| Code review | pass, round 3 @ `a7b454b` (head); 4 open suggestions, none blocking |
| UX review | pass @ `ddfc3e5`; `git diff --name-only ddfc3e5..a7b454b -- frontend/` is empty, not stale |
| UI review | pass @ `ddfc3e5`; same, not stale |
| Spec | `status: approved`, version 1 = build report version 1 |
| Checks (`make check`, `make e2e`) | pass @ `a7b454b734d55143e6aee4db8c792f636f56ee2e` (= head): backend 75 passed, 1 skipped (`PLAN_ADR_DIR` unset), coverage 95%; frontend 6 passed, 100%; e2e 1 passed |
| Branch on base | merge-base = `main` = `e87df94` |

Changes since round 2 (`b835930..a7b454b`) touch only `backend/tests/test_repository.py`, `backend/tests/test_stage.py` (new), `scripts/acceptance-f00.sh` and one README line. No product code changed, so the round 2 independent checks of AC-2 to AC-5 and the Behavior/Security spot checks still apply to head. A smoke re-check of the shared stack at head: `GET :8101/health` and `GET :3101/api/health` → 200 `{"status":"ok"}`; `GET :3101/any/client/path` → shell with `<title>Lesson Ledger</title>`, `lang="en"`, `noscript` text; `APP_URL` headers carry `nosniff`, `Referrer-Policy: same-origin`, CSP `default-src 'self'; frame-ancestors 'none'; ...`.

Independent AC-6 check ran in a fresh `git clone` of the branch in a scratch directory with its own `.env` (`COMPOSE_PROJECT_NAME=ll-approver-f00r3`, ports 8192/3192/5592); the shared stack was never stopped or modified. Containers, volumes and images of the clone were removed afterwards.

### Acceptance criteria
| Criterion | Tests | Independent check | Result |
|---|---|---|---|
| AC-1 | `test_repository.py::test_ac1_*`, now including `test_ac1_adr_content_is_identical_to_the_plan[<file>]` (SHA-256 pin) and `test_ac1_adrs_match_plan_adr_dir` | `shasum -a 256` of `plan/adr/*.md` and `docs/adr/*.md`: all four digests equal and equal to the pinned values. `PLAN_ADR_DIR=<plan>/adr make test T=tests/test_repository.py` → 29 passed, 0 skipped. Mutation: appending a line to `docs/adr/002-local-environment-and-ci.md` in the clone → `test_ac1_adr_content_is_identical_to_the_plan[002-...]` FAILED. Other clauses as in round 2 | pass (APR-2 resolved) |
| AC-2 | unchanged since round 2 | round 2 check still valid (no product change) | pass |
| AC-3 | unchanged since round 2 | round 2 check still valid | pass |
| AC-4 | unchanged since round 2 | round 2 check still valid | pass |
| AC-5 | unchanged since round 2 | round 2 check plus smoke re-check above; checks file `make e2e` 1 passed @ head | pass |
| AC-6 | `test_openapi.py::test_ac6_committed_openapi_schema_matches_code`; `test_stage.py::test_ac6_*` (4 tests, in `make test`); `scripts/acceptance-f00.sh ac6` | `make test T=tests/test_stage.py` → 4 passed. Mutation in the clone: `stage.sh` changed to `exit 0` on failure → `test_ac6_stage_failure_names_the_stage_shows_output_and_keeps_exit_status` and `..._last_200_lines_...` FAILED. `scripts/acceptance-f00.sh ac6` in the clone → exit 0 in 1 min 22 s, 8 PASS lines: `make lint` with stack down prints exactly `lint ok`/`typecheck ok`; `make check` with stack down fails at `test FAILED` pointing to `make up`; `make check` passes in 6 lines, all stage summaries; unused import → `lint FAILED` naming `app/seed.py`; broken backend test → `test FAILED` naming `test_ac2_health_returns_ok_when_database_reachable`; broken frontend test → `test FAILED` naming `App.test.tsx`; API change without `make openapi` → `lint FAILED`, `backend/openapi.json is out of date`; stale `schema.d.ts` → `lint FAILED`, `schema.d.ts is out of date` | pass (APR-1 resolved) |

### Definition of done
| Item | Result |
|---|---|
| Every criterion has tests referencing its id | pass: AC-1 content clause now pinned (APR-2); AC-6 covered by `test_stage.py` in `make test` and by `acceptance-f00.sh ac6` (APR-1). AC-2/AC-3 and the AC-6 fault injection live in `scripts/acceptance-f00.sh`, outside `make check` because they tear the stack down (see CODE-1, non-blocking) |
| CI stages pass locally | pass (`make check`, `make e2e` @ head) |
| Branch rebased on base; migrations apply after base's | pass (merge-base = `main` = `e87df94`) |
| Migrations included and reversible | pass (`backend/alembic/versions/0001_initial.py`, `test_migrations.py`) |
| `make seed` reaches every UI state | pass (shell needs no data) |
| README updated if setup changed | pass (acceptance script line updated for AC-6) |
| No TODOs without a backlog item | pass (`git grep -iE 'TODO|FIXME' HEAD`: none) |

### Findings
| Id | Status | Note |
|---|---|---|
| APR-1 | resolved | `test_stage.py` (catches a swallowed exit status) and `acceptance-f00.sh ac6` (verified passing in an isolated clone). |
| APR-2 | resolved | ADR content pinned by SHA-256; digests match the plan; mutation caught. |

No new findings.

### Decision
Approved, to human merge. All six criteria pass with tests that cover them as written and independent checks at head `a7b454b`, and the Definition of done is met. Note for merge: `scripts/acceptance-f00.sh ac6` runs `make down`/`make up` in the worktree it is run from, so it must not be run against a shared stack.

## Pull request description

```markdown
## F00: Project base

Creates the Lesson Ledger repository with the FastAPI + React + PostgreSQL stack (ADR-001) and the local-only environment and CI gate (ADR-002). Each worktree starts an isolated stack with `make up`, serves an empty accessible "Lesson Ledger" shell at `APP_URL`, and runs the full local CI with `make check` and `make e2e`. No business feature yet.

Spec: projects/PRJ-001-lesson-ledger/specs/F00-project-base.md (v1)

### Acceptance criteria
| Criterion | Verified by |
|---|---|
| AC-1 Repository layout, ADRs identical to plan, `.env` ignored, pinned versions, documented targets | `test_repository.py::test_ac1_*` (incl. ADR SHA-256 pin), independent check |
| AC-2 `make up` healthy, health 200, idempotent seed, `make down` leaves nothing | `test_health.py::test_ac2_*`, `tests/stack/test_stack.py::test_ac2_*`, `scripts/acceptance-f00.sh ac2`, independent check |
| AC-3 Two worktrees side by side | `scripts/acceptance-f00.sh ac3`, independent check |
| AC-4 Health 503 within 5 s with db down, recovers without backend restart | `test_health.py::test_ac4_*`, `scripts/acceptance-f00.sh ac4`, independent check |
| AC-5 Accessible shell, same-origin `/api/health`, client routes, e2e smoke test | `frontend/e2e/shell.spec.ts`, `App.test.tsx`, `indexHtml.test.ts`, `test_ac5_*`, independent check (Playwright) |
| AC-6 Quiet `make check`, `make lint` without stack, failing stage and file/test named | `test_openapi.py::test_ac6_*`, `test_stage.py::test_ac6_*`, `scripts/acceptance-f00.sh ac6`, independent check |

### Reviews
Security: pass · Code: pass · UX: pass · UI: pass · Rounds: 3

### Notes for the reviewer
- Migration: `backend/alembic/versions/0001_initial.py`, empty and reversible; applied on backend start.
- Pinned versions: Python 3.15.2, Node.js 26.13.1, PostgreSQL 18.7, nginx 1.30.6, uv 0.12.22.
- New dependencies: backend fastapi, uvicorn, sqlalchemy, psycopg[binary], alembic (dev: pytest, pytest-cov, httpx2, ruff, mypy, bandit, pip-audit); frontend react, react-dom plus the Vite/Vitest/Playwright/ESLint/Prettier/openapi-typescript toolchain.
- Extra target `make openapi` regenerates `backend/openapi.json` and `frontend/src/shared/api/schema.d.ts`; `make check` fails if either is stale.
- `scripts/acceptance-f00.sh` (AC-2, AC-3, AC-4, AC-6 environment checks) is not part of `make check` because it tears the stack down; run it only in a worktree whose stack you own.
- The scan stage needs network access (pip-audit, npm audit). All published ports bind to 127.0.0.1.
- Open non-blocking suggestions: CODE-1 to CODE-4, SEC-4 (deferred to F01).
```
