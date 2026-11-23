---
feature: F07
project: PRJ-001
reviewer: security
round: 1
verdict: pass
blocking: 0
suggestions: 0
reviewed: feature/F07-home-overview @ f64fbf217de4b367c9ccdf941ddbec43bf4d6e3b
---

# Security review: F07 Home overview

## Round 1

### Findings

None.

Attack surface checked:

- **Entry points**: none added or changed. `git diff main...feature/F07-home-overview --stat -- backend frontend/nginx frontend/package.json frontend/package-lock.json` is empty. Home only calls existing endpoints (`GET /api/monthly-summaries/{month}`, `GET /api/pending-lessons`, `GET /api/lessons`, `GET /api/students` with fixed `page=1&page_size=5|1`, and the existing `PATCH /api/lessons/{id}` through `PaidButton`). Their authentication and per-teacher isolation are F02/F03 behaviour, covered by `tests/test_isolation.py` and F02 AC-5 / F03 AC-5.
- **Authentication**: live check without a session: `GET http://localhost:8105/api/pending-lessons?page=1&page_size=5` and `GET /api/lessons?page=1&page_size=5` both return 401. `/` stays inside `RequireSession` (`HomePage.tsx`), and AC-5 (f) has a test.
- **XSS**: student names render as React text through `StudentName`. Email is a template string passed as a text child (`lead`). The diff has no `dangerouslySetInnerHTML`, `innerHTML`, `eval` or `style=` in non-test source.
- **Input**: the only user input is the existing mark-as-paid action with its fixed `{"paid": true}` body. Query strings are built from constants, and the month comes from the browser clock in the existing `currentMonth()`.
- **Data exposure / logging**: nothing new is sent off the client. There is no `console.*` and nothing goes to browser storage. The session stays in the `["session"]` query.
- **Secrets**: the e2e specs contain only seed passwords, which are already public in `README.md:71` and `backend/app/seed.py`. These are not secrets.
- **CSP**: `curl -sI http://localhost:3105/` returns `default-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'`. This is identical to `frontend/nginx/default.conf` on `main`.
- **Dependencies**: `npm audit --omit=dev` found 0 vulnerabilities. There are no new dependencies.

### Summary
F07 changes only the frontend and only reads existing endpoints. It adds no endpoints, no new inputs, no HTML sinks, no logging and no dependencies. I found no vulnerabilities. Not run because the change has no backend diff: pip-audit, semgrep and bandit.
