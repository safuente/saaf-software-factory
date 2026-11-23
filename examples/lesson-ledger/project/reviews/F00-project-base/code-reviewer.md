---
feature: F00
project: PRJ-001
reviewer: code
round: 3
verdict: pass
blocking: 0
suggestions: 4
reviewed: feature/F00-project-base @ a7b454b734d55143e6aee4db8c792f636f56ee2e
---

# Code review: F00 Project base

## Round 1

### Findings

#### CODE-1: AC-2, AC-3 and AC-4 stack behavior is verified only by a script outside `make check`
- **Severity**: suggestion
- **Category**: traceability
- **Location**: `scripts/acceptance-f00.sh` (functions `ac2`, `ac3`, `ac4`, `ac2_port_in_use`)
- **Criterion**: AC-2, AC-3
- **Problem**: `make down` leaving nothing behind, `make seed` twice, the two-worktree isolation and the `make up` port-in-use failure are only covered by this script. `make check` and `make test` do not run it, so a later feature can break them without any gate noticing.
- **Evidence**: `grep -n 'acceptance-f00' Makefile scripts/tasks.sh` finds nothing. AC-4 and AC-2 (health) also have pytest tests whose names contain the id, so only the environment parts are affected.
- **Suggestion**: Say in `CLAUDE.md` or the README when to run the script (any change to the Makefile, compose file or scripts). The factory's later features can then re-run it when they touch those files.

#### CODE-2: Test-first commits are not split per criterion, and one `test(...)` commit is not tests only
- **Severity**: suggestion
- **Category**: tdd
- **Location**: commits `406e5a6`, `3dc32ea`, `8146daa`
- **Criterion**: none
- **Problem**: The test commit (`406e5a6`, "AC-1..AC-6") precedes the single `feat(F00)` commit `8146daa`, so the order is correct. But there is no per-criterion `test`/`feat` pair, and `3dc32ea` (`test(F00)`) also changes `backend/pyproject.toml` and `backend/uv.lock` (httpx to httpx2, ruff isort, `filterwarnings = error`).
- **Evidence**: `git show --stat 3dc32ea`. No assertion was weakened in that commit: the test diffs are formatting, typing, and one added test.
- **Suggestion**: Put toolchain changes in a `chore(F00)` commit, as `a4525b1` did. Accepted here because this is the base feature with no prior code.

#### CODE-3: Health check shares the default connection pool, so a burst can report a false 503
- **Severity**: suggestion
- **Category**: correctness
- **Location**: `backend/app/core/db.py:10-18`, `backend/app/health/router.py:13`
- **Criterion**: AC-4
- **Problem**: `create_engine` uses the default pool (5 connections, 10 overflow) with `pool_timeout=2`. A sync handler runs in the threadpool, so more than 15 concurrent `/health` calls can raise a pool `TimeoutError`, which is a `SQLAlchemyError`. The handler would answer `database_unavailable` while the database is up. Today only the Docker healthcheck and the proxy call this endpoint, so the risk is low. I did not reproduce it.
- **Evidence**: `database_is_reachable` catches `SQLAlchemyError`, which includes `sqlalchemy.exc.TimeoutError` from the pool.
- **Suggestion**: Keep it in mind when business endpoints start sharing the engine. Either catch only `OperationalError` or use a separate small engine for health.

### Verified without findings
- Checks file: commit equals branch head `ddfc3e5`, result `pass`, `make check` and `make e2e` both exit 0.
- Interfaces: `/health` and `/api/health` bodies, the 503 body, error codes for 404/405/422/500, the `X-Request-ID` rules, no docs or openapi routes and no CORS all match the spec and conventions §4. The OpenAPI file is generated and diffed in lint.
- Structure follows conventions §2 (FastAPI layout, `core/`, `health/`, `alembic/`).
- Migration `0001` is empty and reversible, and `test_migrations.py` covers upgrade, downgrade and re-upgrade.
- Tests assert exact values, use the real database, and mock only the network, via a TCP proxy. No weakened or skipped tests.
- New dependencies are listed in the build report.
- No scope creep. `scripts/` is support for the Makefile targets and AC checks.

### Summary
No blocking findings. The checks are valid for the current head, the code matches the spec and conventions, and the tests are behavior-level with real PostgreSQL. The three suggestions are non-blocking, the most useful being CODE-1: AC-2 and AC-3 environment behavior has no gate in `make check`.

## Round 2

### Previous findings
| Id | Status | Note |
|---|---|---|
| CODE-1 | unresolved | Suggestion, not addressed; non-blocking. |
| CODE-2 | unresolved | Suggestion, accepted for the base feature. The round-2 fix commits keep test commits (`c7aa538`, `dcac059`) tests-only and before their fixes. |
| CODE-3 | unresolved | Suggestion, not addressed; non-blocking. |

### Findings
No new findings. Changes since `ddfc3e5` (loopback port binding, `hide_parameters=True` in the app engine and `alembic/env.py`, stricter `npm audit`) are minimal, each preceded by a red test, and match the build report. Checks file: commit equals head `b835930`, result `pass`.

### Summary
No open blocking findings; the security fixes are small, test-first and correct. Three round-1 suggestions remain open.

## Round 3

### Previous findings
| Id | Status | Note |
|---|---|---|
| CODE-1 | unresolved | Suggestion. README now says the acceptance script is outside `make check` and mentions AC-6, but there is still no gate. Non-blocking. |
| CODE-2 | unresolved | Suggestion, accepted for the base feature. The three new commits are `test(...)` commits and touch only tests, except CODE-4 below. |
| CODE-3 | unresolved | Suggestion, not addressed; non-blocking. |

### Findings

#### CODE-4: A `test(...)` commit also changes the README
- **Severity**: suggestion
- **Category**: tdd
- **Location**: commit `a7b454b` (`README.md`)
- **Criterion**: AC-6
- **Problem**: The commit is labeled test-only but includes a one-line README change next to `scripts/acceptance-f00.sh`.
- **Evidence**: `git show --stat a7b454b` lists `README.md` and `scripts/acceptance-f00.sh`.
- **Suggestion**: Put documentation in a `docs(F00)` commit. Harmless here.

### Verified without findings
- Checks file: commit equals head `a7b454b`, result `pass`, `make check` and `make e2e` exit 0. Backend 75 passed, 1 skipped, coverage 95%; frontend 6 passed, 100%.
- `test_stage.py` (AC-6) tests `scripts/stage.sh` through its public interface with exact outputs: success line, summary line, failure with stage name and exit status kept, and the 200-line truncation. They pass against the existing script.
- ADR tests (APR-2) pin content with SHA-256 digests, so the check does not depend on the external plan. The single skip is the optional `PLAN_ADR_DIR` comparison and is explained in its reason. No assertion was weakened.
- `acceptance-f00.sh` `ac6` runs in a temporary worktree, resets each injected fault with `git checkout`, and has an EXIT trap that tears down and removes the worktree. Not run here because it tears down the shared stack.
- Order: all three commits are test commits and no `feat` follows. They add coverage for behavior already implemented, which is acceptable for approver follow-ups. No scope creep.

### Summary
No blocking findings. The checks are valid for head `a7b454b` and the new tests are specific and behavior-level. Four suggestions remain, all non-blocking.
