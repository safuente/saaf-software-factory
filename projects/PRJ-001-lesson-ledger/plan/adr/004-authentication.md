# ADR-004: Authentication and sessions

- Status: proposed
- Date: 2026-11-16

## Context
- `brief.md` Security: own accounts with email and password; only student names as sensitive data; no regulations.
- `questions.md` A4: open sign-up, no email verification and no password reset in v1, because email delivery is out of scope. Email unique per account.
- ADR-002: the browser talks to one origin; the frontend server proxies `/api` to the backend.
- `policies/conventions.md` §5: authorization checked on the server for every endpoint.

## Decision
- **Accounts**: email + password. Emails are normalized (trimmed, lower-cased) and unique. Passwords are hashed with Argon2id; plain passwords are never stored or logged.
- **Sessions**: server-side sessions stored in PostgreSQL. On login or sign-up the backend sets an opaque random session token in a cookie that is `HttpOnly`, `SameSite=Lax`, `Path=/`, and `Secure` whenever the app is served over HTTPS (configurable by environment variable, off for local HTTP). Sessions expire 14 days after creation. Logout deletes the session server-side and clears the cookie.
- **No tokens in browser storage**: no JWT, nothing auth-related in localStorage or sessionStorage.
- **CSRF**: same-origin requests only, `SameSite=Lax`, and state-changing endpoints accept only JSON bodies, which a cross-site form cannot send without a CORS preflight. CORS is not enabled for credentials.
- **Authorization**: every endpoint except health, sign-up and login requires a valid session; missing or expired session returns 401. Data scoping by teacher follows ADR-003.
- **Login errors** do not reveal whether an email is registered.

## Alternatives considered
- JWT in an `Authorization` header: needs storage in JavaScript-accessible memory or storage (XSS exposure) and makes logout and expiry harder; no benefit with a single backend.
- Stateless signed cookie: cannot be revoked server-side on logout.
- External IdP / SSO: excluded by the brief (own accounts) and by the no-external-services stance of ADR-002.

## Consequences
- The frontend never handles tokens; it calls `/api` on its own origin and reacts to 401 by sending the teacher to the login page.
- Backend API tests authenticate by logging in and reusing the cookie.
- No password reset: a teacher who forgets their password cannot recover the account in v1 (accepted for the pilot; see plan Risks).
- No login rate limiting in v1 (no Redis, local only); recorded as a risk to address before any deployment.
