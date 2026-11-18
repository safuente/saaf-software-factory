---
id: F01
project: PRJ-001
entry: projects/PRJ-001-lesson-ledger/plan/backlog/F01-teacher-accounts.md
status: approved
version: 1
touches_frontend: true
adrs: [ADR-001, ADR-002, ADR-003, ADR-004]
---

# Teacher accounts: sign up, log in, log out

## Summary
A teacher can create an account with an email and a password, log in, see a private home page with their email, and log out. Every app page requires a session; visitors without one are sent to the login page, and the API answers 401 to unauthenticated requests on protected endpoints. Sessions are server-side, carried in an HttpOnly cookie, survive reloads and expire 14 days after creation (ADR-004). `make seed` creates two known teacher accounts for review.

## Acceptance criteria
- **AC-1**: Given no account exists for `carol@example.com`, when a visitor at `{APP_URL}/signup` enters email ` Carol@Example.com ` and password `correct-horse-1` and submits, then `POST /api/teachers` returns 201 with body `{"teacher": {"email": "carol@example.com"}, "expires_at": <created + 14 days>}` and a `Set-Cookie: ll_session=...` with `HttpOnly`, `SameSite=Lax`, `Path=/` and `Max-Age=1209600`, and the browser lands on `/` showing "Signed in as carol@example.com". When a visitor then signs up with `CAROL@example.com` and any valid password, the API returns 409 with error code `email_taken`, the page stays on `/signup` and shows "An account with this email already exists." associated with the Email field (via `aria-describedby`, field has `aria-invalid="true"`), no second account exists, and the backend log lines of that request contain neither the email nor the password. When the visitor submits email `carol@` or a password of 11 characters, no request is sent and the field shows "Enter a valid email address, like name@example.com." or "Password must be at least 12 characters." respectively, with focus moved to the first invalid field; the same inputs sent directly to `POST /api/teachers` return 422 `validation_error`.
- **AC-2**: Given the seeded account `alice@example.com`, when a visitor at `{APP_URL}/login` enters `ALICE@example.com` and the README password and submits, then `POST /api/sessions` returns 200 with the session body and a `ll_session` cookie with the attributes of AC-1, and the browser lands on `/` showing "Signed in as alice@example.com". When the visitor submits `alice@example.com` with a wrong password, and separately `nobody@example.com` with any password, then both responses are 401 with the identical body `{"error": {"code": "invalid_credentials", "message": "Email or password is incorrect.", "details": {}}}` and no `Set-Cookie`, the page stays on `/login` and shows "Email or password is incorrect." once in a `role="alert"` region, the Email field keeps its value, the Password field is emptied, and the backend log lines of both requests contain neither the submitted email nor the password.
- **AC-3**: Given a logged-in teacher `alice@example.com`, when they open `/`, then the page shows `h1` "Lesson Ledger", the text "Signed in as alice@example.com" and a "Log out" button reachable and activatable by keyboard. When they activate "Log out", then `DELETE /api/sessions/current` returns 204 with a `Set-Cookie` that clears `ll_session` (`Max-Age=0`), the browser is on `/login`; pressing the browser Back button or opening `/` again ends on `/login` without the email ever being displayed; and sending the old cookie value to `GET /api/sessions/current` returns 401.
- **AC-4**: Given a browser with no `ll_session` cookie, when it opens `/` or `/some/other/path`, then it ends on `/login` and the home page content is never rendered. Given no cookie, a cookie with value `not-a-real-token`, or the cookie of a logged-out session, when `GET /api/sessions/current` or `DELETE /api/sessions/current` is called, then each returns 401 with body `{"error": {"code": "not_authenticated", "message": "Authentication required", "details": {}}}`. Given a logged-in teacher, when they open `/login` or `/signup`, then they end on `/`.
- **AC-5**: Given a logged-in teacher on `/`, when they reload the page, then they stay on `/` and still see their email, without passing through `/login`. Given a session created 14 days minus 1 minute ago, `GET /api/sessions/current` returns 200; given a session created 14 days plus 1 minute ago, it returns 401 `not_authenticated`, and a browser holding that session's cookie that opens `/` ends on `/login`.
- **AC-6**: Given a database where `make seed` has already run once, when `make seed` runs again, then it exits 0, exactly one teacher exists for each of `alice@example.com` and `bob@example.com`, `POST /api/sessions` with each email and the password listed for it in the README's seed section returns 200, and the README seed section lists both emails and passwords.

## Behavior
- **Pages** (client-side routes): `/signup` and `/login` are public; every other path is an app page and requires a session. A teacher without a valid session who opens an app page is sent to `/login`. A teacher with a valid session who opens `/login` or `/signup` is sent to `/`.
- Default chosen: after sign-up or login the teacher always lands on `/`, not on the page they originally requested (only `/` exists in F01).
- Default chosen: a logged-in teacher opening an app path that does not exist is sent to `/`.
- **Session check**: every app page checks the session with the server on load (`GET /api/sessions/current`); no auth state is kept in browser storage (ADR-004). Any 401 from any API call while on an app page sends the teacher to `/login`. On logout the frontend discards all cached server data, so Back cannot show the previous teacher's data.
- **Email rules** (Default chosen): leading and trailing whitespace removed, then lower-cased (ADR-004). Valid when, after trimming: 3 to 254 characters, no whitespace, exactly one `@`, at least one character before it, and a domain after it that contains a `.` that is neither its first nor last character. Uniqueness is on the normalized value, so it is case-insensitive.
- **Password rules** (Default chosen): 12 to 128 characters, counted as Unicode code points; any characters allowed, including spaces; not trimmed; no composition rules. Login accepts any password and fails with `invalid_credentials` when it does not match, including passwords over 128 characters.
- **Rules shown before submission** (entry Constraints): the Email field shows the hint "Example: name@example.com" and the Password field on sign-up shows "At least 12 characters." as visible text associated with the field, before any submission. The login form does not apply length or format rules beyond requiring both fields; an empty field shows "Enter your email." / "Enter your password." without sending a request.
- **Validation on the server**: sign-up applies the same email and password rules and returns 422 `validation_error` with the existing details format (`{"errors": [{"loc", "msg", "type"}]}`); the details never echo the submitted values. Login with a missing field or a non-string value returns 422; with a syntactically wrong email it returns 401 `invalid_credentials`.
- **Duplicate email**: returns 409 `email_taken`, including when two sign-ups for the same email arrive at the same time: exactly one gets 201 and the other 409, never 500.
- **Sessions** (ADR-004): sign-up and login each create a new server-side session and set the cookie; if the request already carried a valid session, that session is deleted. Sessions expire 14 days after creation, fixed (not extended by activity). Logout deletes the session server-side and clears the cookie. Expired sessions are rejected; removing their rows is not required.
- **Login timing**: the response time of a login with an unregistered email is not distinguishable from one with a registered email and wrong password (the password check runs in both cases), so timing does not reveal registered emails.
- **Submitting state**: while a form request is in flight, its submit button is disabled and labelled "Creating account…" / "Logging in…", so double submission sends one request.
- **Failures**: if a sign-up or login request fails with a network error or a 5xx, the form shows "Something went wrong. Please try again." in a `role="alert"` region and keeps the entered email. If the session check on an app page fails with a network error or 5xx, the page shows "We couldn't reach Lesson Ledger." with a "Try again" button and does not redirect to `/login`.
- **Seed**: `make seed` creates (or keeps) `alice@example.com` with password `alice-ledger-pass` and `bob@example.com` with password `bob-ledger-pass1`, resetting their passwords to these values if they exist. It is idempotent and prints one line. These are synthetic local-only credentials.
- **Logging** (entry Constraints, SEC-4 from F00): emails and passwords never appear in logs. Expected constraint errors (duplicate email) are handled as 409 and not logged as exceptions. Unexpected database errors are logged with the exception class and the database error code (SQLSTATE) only, never the database driver's message text, which can quote input values.

## Interfaces

### API
All bodies JSON; errors use the conventions §4 body. State-changing endpoints accept only `Content-Type: application/json` (ADR-004 CSRF rule); other content types return 415 with code `unsupported_media_type`.

Session body (shared by the endpoints below):
```json
{"teacher": {"email": "alice@example.com"}, "expires_at": "2026-12-01T10:00:00Z"}
```
`expires_at` is ISO 8601 UTC, equal to session creation time + 14 days.

- `POST /api/teachers` (public): sign up.
  - Request `{"email": string, "password": string}`.
  - 201 session body, sets `ll_session` cookie.
  - 409 `email_taken`, message "An account with this email already exists."
  - 422 `validation_error` (rules in Behavior).
- `POST /api/sessions` (public): log in.
  - Request `{"email": string, "password": string}`.
  - 200 session body, sets `ll_session` cookie.
  - 401 `invalid_credentials`, message "Email or password is incorrect.", no `Set-Cookie`.
  - 422 `validation_error` for a missing or non-string field.
- `GET /api/sessions/current` (session required): 200 session body; 401 `not_authenticated`, message "Authentication required".
- `DELETE /api/sessions/current` (session required): 204 no body, clears `ll_session` (`Max-Age=0`, same `Path`); 401 `not_authenticated`.
- Health endpoints unchanged and public.
- OpenAPI schema and generated frontend types updated (ADR-001).

**Cookie** `ll_session`: opaque random token of at least 32 bytes of entropy, `HttpOnly`, `SameSite=Lax`, `Path=/`, `Max-Age=1209600`, `Secure` when `SESSION_COOKIE_SECURE=true`.

### Data model
New migration, reversible:
- **teacher**: `id` integer surrogate key; `email` text, not null, unique, stored normalized (lower-case, trimmed), max 254; `password_hash` text, not null (Argon2id); `created_at` timestamp with time zone (UTC), not null.
- **session**: `id` integer surrogate key; `teacher_id` references teacher, not null, delete restricted (ADR-003); `token_hash` text, not null, unique (a one-way hash of the cookie token; the raw token is not stored); `created_at` and `expires_at` timestamp with time zone (UTC), not null.
No existing data to migrate.

### Configuration
- New variable `SESSION_COOKIE_SECURE` (`true` / `false`), added to `.env.example` as `false` with a comment that it must be `true` when served over HTTPS (plan Risks), and documented in the README configuration table.

## UI
Shared: every page keeps `html lang="en"` and a `main` landmark with one `h1`. Document titles: "Log in · Lesson Ledger", "Create your account · Lesson Ledger", "Lesson Ledger".

**`/login`**
- **Default**: `h1` "Log in"; labelled fields "Email" (type email, `autocomplete="username"`, hint "Example: name@example.com") and "Password" (type password, `autocomplete="current-password"`); button "Log in"; text "No account yet?" with link "Create an account" to `/signup`.
- **Submitting**: button disabled, label "Logging in…".
- **Field errors**: empty field messages (Behavior) under the field, associated via `aria-describedby`, `aria-invalid="true"`, focus on the first invalid field.
- **Error**: "Email or password is incorrect." or "Something went wrong. Please try again." in a `role="alert"` region above the button.
- **Success**: navigates to `/`.
- **No permission**: a logged-in teacher is redirected to `/`.

**`/signup`**
- **Default**: `h1` "Create your account"; labelled fields "Email" (`autocomplete="username"`, hint "Example: name@example.com") and "Password" (`autocomplete="new-password"`, hint "At least 12 characters."); button "Create account"; text "Already have an account?" with link "Log in" to `/login`.
- **Submitting**: button disabled, label "Creating account…".
- **Field errors**: format, length and duplicate-email messages from AC-1 under the field, associated and focused as on `/login`.
- **Error**: "Something went wrong. Please try again." in a `role="alert"` region.
- **Success**: navigates to `/`.
- **No permission**: a logged-in teacher is redirected to `/`.

**`/` (home)**
- **Loading**: while the session check runs, the `main` landmark shows "Loading…" in a `role="status"` region; no email is shown.
- **Success**: `h1` "Lesson Ledger", "Signed in as {email}", button "Log out".
- **Empty**: not applicable; the home page shows no data besides the email.
- **Error**: session check failed (network or 5xx): "We couldn't reach Lesson Ledger." and button "Try again", which repeats the check.
- **No permission**: no or expired session: redirected to `/login`.
- **Logging out**: "Log out" disabled while the request is in flight; if logout fails with a network error or 5xx, the teacher stays on `/` and sees "Couldn't log out. Please try again." in a `role="alert"` region.

## Security considerations
- **Access**: public endpoints are health, `POST /api/teachers` and `POST /api/sessions`; every other endpoint, including all future ones, requires a valid, unexpired session and returns 401 otherwise (ADR-004). A session gives access only to its own teacher's data; the only data in F01 is the teacher's own email.
- **User input**: email and password from the sign-up and login forms, and the `ll_session` cookie value. Validated at the boundary (Behavior); unknown or malformed cookie values are treated as no session. Request bodies only as JSON (CSRF, ADR-004).
- **Personal data**: teacher email. It leaves the system only in responses to its own session. Never logged; this includes database error text (SEC-4 from F00, Behavior "Logging") and validation error details.
- **Secrets**: passwords stored only as Argon2id hashes, never logged or returned. Session tokens are random, sent only in the HttpOnly cookie, and stored only as a one-way hash, so a database read does not yield usable tokens. Nothing auth-related in localStorage or sessionStorage.
- **Account enumeration**: login gives one generic error and comparable timing for unknown emails and wrong passwords. Sign-up reveals that an email is registered (409), which the entry requires; accepted together with the absence of rate limiting (plan Risks, out of scope).
- **Session lifecycle**: fresh token on every login and sign-up; server-side deletion on logout; fixed 14-day expiry checked on the server for every request.
- **Cookie `Secure` flag**: off by default for local HTTP via `SESSION_COOKIE_SECURE=false`; must be `true` in any HTTPS deployment (plan Risks).
- **Seed credentials**: synthetic, local-only, documented in the README; never valid outside a local stack.

## Non-functional
- Accessibility WCAG 2.1 AA (`questions.md` A11): `/login`, `/signup` and `/` in their default and error states report 0 axe-core violations for the wcag2a, wcag2aa and wcag21aa rule sets; all controls operable by keyboard in a logical tab order with a visible focus indicator; text contrast at least 4.5:1; errors announced (`role="alert"` or focus moved to the invalid field) and associated with their field.
- Layout works without horizontal scrolling at 1280 px and 768 px wide (desktop/laptop users per the entry).
- Design tokens (UI-1 from F00): colors, spacing and font sizes used by the new screens come from one shared set of named values that later features reuse, not repeated literals.
- Interface text in English (US).

## Out of scope
- Password reset, email verification, changing email or password, deleting the account (`questions.md` A4).
- Social login or SSO.
- Login and sign-up rate limiting (plan Risks).
- Students and lessons (F02).
- "Remember me", sliding session renewal, listing or revoking other sessions.
- Removal of expired session rows.
- Returning to the originally requested page after login.

## Traceability
| Expected result | Criteria |
|---|---|
| Sign up with email and password, land logged in; duplicate email in any case shows a clear error | AC-1 |
| Log in; wrong credentials show one generic error that does not reveal whether the email exists | AC-2 |
| Authenticated home with email and log out; after logout, app pages go to login | AC-3 |
| Not logged in → login page; API returns 401 for protected data | AC-4 |
| Session survives reload and expires after 14 days (ADR-004) | AC-5 |
| `make seed` creates at least two teachers with known credentials in the README | AC-6 |

## Open questions
None.

## Changelog
