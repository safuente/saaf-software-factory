---
feature: F01
project: PRJ-001
reviewer: security
round: 1
verdict: pass
blocking: 0
suggestions: 2
reviewed: feature/F01-teacher-accounts @ 23a6634c8c6a05d14fd2b5950f7bd9890b8c3800
---

# Security review: F01 Teacher accounts: sign up, log in, log out

## Round 1

### Findings

#### SEC-1: Session requirement is opt-in per endpoint, not default-deny
- **Severity**: suggestion
- **Category**: authentication
- **Location**: `backend/app/accounts/auth.py:24-33`, `backend/app/main.py:36-38`
- **Criterion**: none
- **Problem**: The spec says every non-public endpoint, "including all future ones", requires a session. Today that holds only because each protected route declares a `CurrentSession` parameter. A later endpoint (F02 students and lessons) that leaves out the parameter is public, and no test would catch it.
- **Evidence**: Both protected routes in F01 declare `session: CurrentSession`. No app- or router-level dependency enforces it, and no test enumerates `app.routes` to check that each non-public route returns 401 without a cookie. F01 has no exploit because both protected endpoints are covered (`tests/test_ac4_session_required.py:22-50`; live check: `GET /api/sessions/current` with `ll_session=not-a-real-token` returned 401 `not_authenticated`).
- **Suggestion**: Make it default-deny. Either use a protected `APIRouter(dependencies=[Depends(require_session)])` for all non-public routes, or add a test that walks `app.routes`, skips an explicit public allow-list (health, `POST /api/teachers`, `POST /api/sessions`) and asserts 401 `not_authenticated` for every other route without a cookie.

#### SEC-2: Login and sign-up accept unbounded request bodies for an Argon2 check
- **Severity**: suggestion
- **Category**: abuse
- **Location**: `backend/app/accounts/schemas.py:39-44` (`LogInRequest`), `backend/app/accounts/security.py:24-31`
- **Criterion**: none
- **Problem**: `LogInRequest.email` and `.password` have no maximum length, and no request body size limit exists. Each login, including one for an unknown email, runs a full Argon2id verification, which by default costs about 64 MiB of memory and tens of milliseconds. With no rate limiting, an unauthenticated client can cheaply load the backend's CPU and memory with parallel logins or very large bodies.
- **Evidence**: The spec puts rate limiting out of scope and accepts that risk (plan Risks, ADR-004), so this is not blocking. The spec only requires that passwords over 128 characters return 401, which a generous cap such as 1–4 KiB would still allow.
- **Suggestion**: Cap the login field lengths well above the sign-up rules (for example, return 401 or 422 above a few KiB without hashing), limit the request body size at nginx (`client_max_body_size`), and keep rate limiting on the pre-deployment risk list.

### Summary
F01 implements the spec's security considerations. Sessions are server-side, use 32-byte `secrets` tokens, and are stored as SHA-256 hashes. The fixed 14-day expiry is checked in the session lookup query. The old session is deleted on login and sign-up, and logout revokes the session on the server. Passwords use Argon2id with a dummy hash for unknown emails, and login returns the same 401 body for unknown emails and wrong passwords. Request bodies must be JSON (415 otherwise; confirmed live), no CORS is configured, and responses contain only the email and `expires_at`. Validation error details and DB error logs never include input values, and the frontend reads and stores no tokens. Negative tests exist for 401 (no cookie, malformed cookie, logged-out session, expired session), 415, 422 and own-teacher scoping.

There are no blocking findings. The most useful follow-up is SEC-1, making authentication default-deny before F02 adds data endpoints.

Tooling: `pip-audit` found no known vulnerabilities, and `npm audit --omit=dev` found 0 vulnerabilities. `bandit -r app` reported only B101 on the type-narrowing `assert`s in the error handlers, which are not a security issue and were discarded. `semgrep` is not installed and was not run. Live checks used a new account `sec-review-*@example.com`; no seed records were modified. The frontend served at `app_url` sends `CSP frame-ancestors 'none'`, `nosniff` and `Referrer-Policy`.
