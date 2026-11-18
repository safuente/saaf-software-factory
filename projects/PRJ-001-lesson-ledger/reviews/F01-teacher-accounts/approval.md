---
feature: F01
project: PRJ-001
round: 1
decision: approved
route_to: human-merge
reviewed: feature/F01-teacher-accounts @ 23a6634c8c6a05d14fd2b5950f7bd9890b8c3800
spec_version: 1
---

# Approval: F01 Teacher accounts: sign up, log in, log out

## Round 1

### Preconditions
| Check | Result |
|---|---|
| Security review | pass @ 23a6634 (round 1, 0 blocking, 2 suggestions) |
| Code review | pass @ 23a6634 (round 1, 0 blocking, 4 suggestions) |
| UX review | pass @ 23a6634 (round 1, 0 blocking, 3 suggestions) |
| UI review | pass @ 23a6634 (round 1, 0 blocking) |
| Spec status and version | `approved`, v1; build report v1 |
| Checks (`make check`, `make e2e`) | pass @ 23a6634c8c6a05d14fd2b5950f7bd9890b8c3800 (backend 168 passed / 1 skipped, frontend 69 passed, e2e 17 passed). The skip is `test_repository.py` (PLAN_ADR_DIR not set), unrelated to F01. |

Independent checks ran on 2026-11-17 against `http://localhost:3102` and `http://localhost:8102` (compose project `lesson-ledger-f01`). Scripts and screenshots: `/private/tmp/claude-501/-Users-saaf-workspace-saaf-software-factory/1970f24f-a397-48d4-a233-ca6562813eac/scratchpad/apr/`.

### Acceptance criteria
| Criterion | Tests | Independent check | Result |
|---|---|---|---|
| AC-1 | `test_ac1_signup.py` (201 body, `expires_at == created + 14d`, cookie `Max-Age=1209600`, 409 + `count == 1`, no log of email/password, 422 without echo); `test_stack.py::test_ac1_ac2_backend_logs_of_account_requests_hold_no_email_or_password`; `SignupPage.test.tsx`; `e2e/ac1-signup.spec.ts` | `POST /api/teachers {" Carol@Example.com ","correct-horse-1"}` → 201 `{"teacher":{"email":"carol@example.com"},"expires_at":"2026-12-01T15:49:24Z"}` at 15:49:24Z, `Set-Cookie: ll_session=…; HttpOnly; Max-Age=1209600; Path=/; SameSite=lax`. `CAROL@example.com` → 409 `email_taken`; logging in as carol with the second password → 401 (no second account). `carol@` / 11-char password → 422 `validation_error`, details do not echo values. Backend log lines for request ids `c0f82ab…`, `4ae4fd1…` hold only method/path/status/duration; `grep -i` for the emails and passwords in the last 5 min of logs: 0 hits. Playwright: sign-up lands on `/` with "Signed in as …"; duplicate stays on `/signup`, Email `aria-describedby` → "An account with this email already exists.", `aria-invalid="true"`, focus on Email; `carol@` and 11-char password show the exact messages, focus on the invalid field, 0 requests sent (`ac1-home.png`, `ac1-dup.png`). | pass |
| AC-2 | `test_ac2_login.py` (200 any case + 14d `expires_at` + cookie, identical 401, no Set-Cookie); `test_stack.py` log test; `LoginPage.test.tsx`; `e2e/ac2-login.spec.ts` | `POST /api/sessions {"ALICE@example.com","alice-ledger-pass"}` → 200 session body, cookie with AC-1 attributes. Wrong password and `nobody@example.com` → both 401 with byte-identical body `{"error":{"code":"invalid_credentials","message":"Email or password is incorrect.","details":{}}}`, no `set-cookie`. Their log lines (`4c537b4…`, `f77203d…`) contain no email/password. Playwright, both cases: stays on `/login`, one `role="alert"` with the message, message count 1, Email keeps its value, Password `""` (`ac2-alice.png`, `ac2-nobody.png`). | pass |
| AC-3 | `test_ac3_logout.py`; `HomePage.test.tsx`; `e2e/ac3-logout.spec.ts` (watches for the email during Back and `/`) | Playwright as alice: h1 "Lesson Ledger", "Signed in as alice@example.com", "Log out" reached with 1 Tab, activated with Enter → `DELETE /api/sessions/current` 204, `Set-Cookie: ll_session=""; …; Max-Age=0; Path=/`, URL `/login`; Back → `/login`, `/` → `/login`, email not visible; old token on `GET /api/sessions/current` → 401. Same via curl: 204 then 401 `not_authenticated`. | pass |
| AC-4 | `test_ac4_session_required.py`; `SessionGate.test.tsx`; `queryClient.test.ts`; `e2e/ac4-redirects.spec.ts` | curl: GET and DELETE `/api/sessions/current` with no cookie, `ll_session=not-a-real-token` and a logged-out token → all six 401 `{"error":{"code":"not_authenticated","message":"Authentication required","details":{}}}`. Playwright: anonymous `/` and `/some/other/path` → `/login`, h1 "Log in", "Signed in as" never rendered (MutationObserver from init). Logged in, `/login` and `/signup` → `/`. | pass |
| AC-5 | `test_ac5_session_expiry.py` (14d − 1 min 200, 14d + 1 min 401 GET and DELETE, not extended); `sessionPersistence.test.tsx`; `e2e/ac5-session-lifetime.spec.ts` (expired cookie on `/` → `/login`) | Playwright: reload on `/` → only `/` navigated, email still shown. Expiry boundary through the project's test client: `make test T=tests/test_ac5_session_expiry.py` → 3 passed. The browser-redirect half rests on the e2e run in the checks file plus the observed 401 → `/login` behavior (AC-3, AC-4); creating an aged session needs direct DB access, which I did not do. | pass |
| AC-6 | `test_ac6_seed.py` (README section parsed, seed twice → one row each, password reset, concurrent runs); `test_stack.py::test_ac6_make_seed_runs_twice_and_seeded_accounts_log_in` (real `make seed` twice, exit 0, one line each) | README "Seed data" lists `alice@example.com` / `alice-ledger-pass` and `bob@example.com` / `bob-ledger-pass1`. `POST /api/sessions` with each → 200. I did not run `make seed` (orchestrator-owned); the double run is covered by the stack test passing at 23a6634 in the checks file. | pass |

Behavior and Security rules spot-checked:
- Concurrent duplicate sign-ups (4 parallel `POST /api/teachers`, same email) → one 201, three 409, no 500.
- Email rules: `a@.bc`, `a@bc.`, `a@@b.c`, `a b@c.d`, 256-char → 422; 254-char → 201.
- Password rules: 128 → 201, 129 → 422; 12 emoji (48 bytes) → 201, 11 emoji → 422 (code points); 12 spaces → 201 (not trimmed).
- Login: syntactically wrong email → 401 `invalid_credentials`; missing / non-string password → 422; 200-char password → 401.
- Non-JSON `Content-Type` → 415 `unsupported_media_type`.
- Logged-in teacher on `/does/not/exist` → `/`.
- No auth state in `localStorage`/`sessionStorage` (length 0 after sign-up).
- Not checked independently: the network/5xx error states (stopping the backend would disturb the shared stack). Covered by the component tests and reached through the README procedure the UX and UI reviewers used.

### Definition of done
| Item | Result |
|---|---|
| Every criterion has tests referencing its id | pass (AC-1 to AC-6 all have backend, frontend and/or e2e tests with the id in the name) |
| CI green | pass @ 23a6634 |
| Branch rebased on base; migrations apply after base's | pass: merge-base = `main` = 46bd558; `0002_teacher_and_session` follows F00 |
| Migrations included and reversible | pass: `downgrade()` drops both tables; `test_migrations.py` up/down/up |
| `make seed` reaches every UI state | pass: README "Seed data" lists how to reach each state (error states by stopping the backend) |
| README updated if setup changed | pass: `SESSION_COOKIE_SECURE` in README configuration table and `.env.example` (`false`, HTTPS comment); seed section added |
| No TODOs without a backlog item | pass: no `TODO`/`FIXME` in the branch |

### Findings
None.

### Decision
Approved, routed to human merge. All six criteria pass on both the tests and independent checks against the running app, and the Definition of done is met. Reviewer suggestions SEC-1 (default-deny session requirement) and SEC-2 (body size limit before Argon2) are worth carrying into F02.

## Pull request description

```markdown
## F01: Teacher accounts: sign up, log in, log out

Teachers can sign up with an email and password, log in, see a private home page showing their email, and log out. Every app page requires a server-side session carried in an HttpOnly `ll_session` cookie with a fixed 14-day expiry; protected API endpoints return 401 without one. `make seed` creates two known local accounts (alice, bob).

Spec: projects/PRJ-001-lesson-ledger/specs/F01-teacher-accounts.md (v1)

### Acceptance criteria
| Criterion | Verified by |
|---|---|
| AC-1 Sign up, duplicate email in any case, client and server validation | `test_ac1_signup.py`, `test_stack.py::test_ac1_ac2_backend_logs_…`, `SignupPage.test.tsx`, `e2e/ac1-signup.spec.ts`, independent check |
| AC-2 Log in; one generic error for wrong password and unknown email | `test_ac2_login.py`, `LoginPage.test.tsx`, `e2e/ac2-login.spec.ts`, independent check |
| AC-3 Home page and keyboard log out; old session revoked | `test_ac3_logout.py`, `HomePage.test.tsx`, `e2e/ac3-logout.spec.ts`, independent check |
| AC-4 No session → `/login`; 401 `not_authenticated`; logged-in → `/` | `test_ac4_session_required.py`, `SessionGate.test.tsx`, `e2e/ac4-redirects.spec.ts`, independent check |
| AC-5 Session survives reload; expires 14 days after creation | `test_ac5_session_expiry.py`, `sessionPersistence.test.tsx`, `e2e/ac5-session-lifetime.spec.ts`, independent check |
| AC-6 Idempotent seed with README credentials | `test_ac6_seed.py`, `test_stack.py::test_ac6_make_seed_runs_twice_…`, independent check |

### Reviews
Security: pass · Code: pass · UX: pass · UI: pass · Rounds: 1

### Notes for the reviewer
- Migration `backend/alembic/versions/0002_teacher_and_session.py` adds `teacher` and `session` (FK `ON DELETE RESTRICT`); reversible.
- New dependencies: backend `argon2-cffi`; frontend `react-router`, `@tanstack/react-query`; frontend dev `@testing-library/user-event`, `@axe-core/playwright`.
- New config `SESSION_COOKIE_SECURE` (default `false`). It must be `true` in any HTTPS deployment.
- The test DB is shared with the running stack and `test_migrations.py` downgrades it, which wipes seed data: run `make seed` after `make test` / `make check` before manual review.
- E2E helpers use `docker compose exec db psql` (aged sessions, removing `carol@example.com`), so `make e2e` needs Docker and `.env`.
- The session requirement is per-route (`CurrentSession`), not default-deny (SEC-1 suggestion). Consider a protected router or a route-enumeration test before F02 adds endpoints.
- `test_login_timing_does_not_reveal_registered_emails` is statistical (median ratio 0.5–2).
```
