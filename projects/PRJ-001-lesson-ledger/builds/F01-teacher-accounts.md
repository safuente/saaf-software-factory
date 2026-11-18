# Build report: F01 Teacher accounts: sign up, log in, log out

- Spec: projects/PRJ-001-lesson-ledger/specs/F01-teacher-accounts.md (version 1)
- Repo: workspaces/.worktrees/lesson-ledger/F01-teacher-accounts
- Branch: feature/F01-teacher-accounts (27 commits on top of main 46bd558, no rebase needed: main unchanged, no remote)
- Mode: build
- Result: complete

## Criteria
| Criterion | Tests | Status |
|---|---|---|
| AC-1 | backend/tests/test_ac1_signup.py (201 body + cookie attributes, Secure when configured, Argon2id + token hash only, 409 `email_taken` in other case + no log of email/password/exception, concurrent duplicates 201/409, 422 without echo, email/password rule tables, missing/non-string fields, 415 non-JSON); backend/tests/test_config_cookie_secure.py; backend/tests/test_db_error_logging.py (class + SQLSTATE only); backend/tests/test_migrations.py::test_ac1_migrations_create_teacher_and_session_tables; backend/tests/stack/test_stack.py::test_ac1_ac2_backend_logs_of_account_requests_hold_no_email_or_password; frontend/src/features/auth/SignupPage.test.tsx; frontend/src/features/auth/validation.test.ts; frontend/e2e/ac1-signup.spec.ts | passing |
| AC-2 | backend/tests/test_ac2_login.py (200 any case, identical 401 for wrong password/unknown email with no Set-Cookie and no logged values, syntactically wrong email 401, >128 chars 401, 422 missing/non-string, 415, previous session deleted, timing ratio); frontend/src/features/auth/LoginPage.test.tsx; frontend/e2e/ac2-login.spec.ts | passing |
| AC-3 | backend/tests/test_ac3_logout.py; frontend/src/features/auth/HomePage.test.tsx (keyboard log out, cache discarded, in-flight disabled, failure alert, 401 to /login); frontend/e2e/ac3-logout.spec.ts (Tab + Enter, `Max-Age=0`, Back and `/` end on /login with the email never rendered, old cookie 401) | passing (API part already passed with the AC-4 endpoints) |
| AC-4 | backend/tests/test_ac4_session_required.py (no cookie, `not-a-real-token`, malformed, logged-out cookie for GET and DELETE; own teacher only); frontend/src/features/auth/SessionGate.test.tsx; frontend/src/app/queryClient.test.ts (any 401 `not_authenticated` ends the app session); frontend/e2e/ac4-redirects.spec.ts | passing (frontend redirects already passed with the AC-1 session gate) |
| AC-5 | backend/tests/test_ac5_session_expiry.py (14 d - 1 min 200, 14 d + 1 min 401, not extended by use); frontend/src/features/auth/sessionPersistence.test.tsx; frontend/e2e/ac5-session-lifetime.spec.ts (reload, expired cookie to /login) | passing (already passed with the AC-4 endpoints and session gate) |
| AC-6 | backend/tests/test_ac6_seed.py (README section, twice idempotent, password reset, concurrent runs); backend/tests/stack/test_stack.py::test_ac6_make_seed_runs_twice_and_seeded_accounts_log_in | passing |
| Non-functional | frontend/e2e/accessibility.spec.ts (axe wcag2a/2aa/21aa 0 violations on /login, /signup, / default and error states; no horizontal scroll at 1280/768; tab order and visible focus); SessionGate.test.tsx focus on new page h1 | passing |

## Checks
| Stage | Command | Result |
|---|---|---|
| Install | `make check` (install) | pass |
| Lint | `make lint` (ruff, ESLint, Prettier, OpenAPI contract) | pass |
| Type check | `make lint` (mypy strict, tsc) | pass |
| Tests | `make test` | pass: backend 168 passed, 1 skipped, coverage 98%; frontend 69 passed, coverage 95% |
| Build | `make check` (build) | pass |
| Scan | `make check` (bandit, pip-audit, npm audit) | pass |
| E2E | `make e2e` | pass, 17 passed (7 consecutive green runs) |

## Changes
- New dependencies:
  - backend `argon2-cffi`: Argon2id password hashing (ADR-004).
  - frontend `react-router`, `@tanstack/react-query`: routing and server state, both mandated by ADR-001 and not yet installed.
  - frontend dev `@testing-library/user-event`: keyboard/typing interactions in component tests; `@axe-core/playwright`: the spec's axe-core WCAG checks.
- Migrations: `backend/alembic/versions/0002_teacher_and_session.py` (teacher, session; FK `ON DELETE RESTRICT`; unique email and token hash; email length and lower-case checks). Downgrade tested by `test_migrations.py`.
- Configuration: `SESSION_COOKIE_SECURE` in `.env.example` (false, with HTTPS comment), README configuration table and `docker-compose.yml`.
- Tests changed rather than added:
  - `backend/tests/test_migrations.py::test_f00_creates_no_application_tables` replaced by `test_ac1_migrations_create_teacher_and_session_tables`: the F01 Data model adds tables.
  - `backend/tests/test_openapi.py::test_openapi_schema_contains_health_endpoints_only` now expects the F01 endpoints too (spec Interfaces).
  - `backend/tests/conftest.py`: upgrades the schema to head once per run and adds the `accounts` fixture.
  - `frontend/e2e/shell.spec.ts` (F00 AC-5): `/` without a session now ends on `/login` (F01 AC-4); still checks `lang="en"` and one h1 in `main`.
  - `test_ac2_login.py::test_login_creates_fresh_token_and_deletes_the_session_it_carried`: my own assertion was wrong (it ignored the session created by the fixture's sign-up); fixed in the feat commit to check that the carried token's session is deleted.

## Open issues
- **Test DB is shared with the running stack.** `test_migrations.py` downgrades to base and back, which wipes seeded accounts. Run `make seed` after `make test`/`make check` before manual review. The e2e specs seed themselves (`make seed` in `beforeAll`), which is why the seed is now an upsert (parallel workers collided; fixed in 23a6634).
- E2E helpers in `frontend/e2e/support/stack.ts` reach the database through `docker compose exec db psql` (only to create an expired session and remove the fixed `carol@example.com` account). They need Docker and `.env` (as `make e2e` provides).
- JSON-only rule (415) is enforced app-wide for POST/PUT/PATCH. `DELETE /api/sessions/current` carries no body and is not checked; a cross-site form cannot send DELETE and `SameSite=Lax` withholds the cookie from cross-site fetches.
- Decisions not spelled out in the spec:
  - Log out pushes `/login` instead of replacing the history entry, so Back goes to `/` and the gate sends it to `/login` (with replace, Back left the app).
  - Every page focuses its h1 on mount (`tabIndex=-1`, no outline). Without this, focus was lost after client-side navigation and the next Tab went to the wrong place.
  - The loading and "We couldn't reach Lesson Ledger." states of `/` show the h1 "Lesson Ledger" so every page keeps one h1. The email and "Log out" are never rendered before the check succeeds.
  - On `/login` and `/signup` the form renders while the session check runs, and redirects to `/` if a session exists.
  - Login sends the trimmed email. Login and sign-up keep the password after a network error or 5xx; login empties it only on 401.
- `test_login_timing_does_not_reveal_registered_emails` compares median times (ratio must be between 0.5 and 2). It has been stable, but it is statistical.
- Backend and stack tests leave a few `stack-*@example.com` teacher rows in the local database. They are harmless and removed by `make down`.
- TDD trail: the frontend red runs for AC-1 and AC-2 failed on missing modules and missing headings, not on assertions. The e2e specs (d829396) were written after the component tests drove the implementation. They failed for Back after log out and for keyboard focus after navigation, which 3e71897 fixes.
- Reachable review states and how to reach them (including stopping the backend for the error states) are listed in README "Seed data".
