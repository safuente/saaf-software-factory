---
feature: F03
project: PRJ-001
reviewer: security
round: 1
verdict: pass
blocking: 0
suggestions: 0
reviewed: feature/F03-monthly-summary-and-payments @ 519d18c50f1ff052a74ebd3f98e34e6e0f466ec1
---

# Security review: F03 Monthly summary, pending payments, mark as paid

## Round 1

### Findings

No findings.

Attack surface reviewed: `GET /api/monthly-summaries/{month}`, `GET /api/lessons?month=` (changed), `GET /api/pending-lessons`, `PATCH /api/lessons/{id}` (`backend/app/lessons/router.py`, `service.py`, `schemas.py`, `rules.py`), the new frontend pages under `frontend/src/features/payments/`, and the seed change. Data leaves the system only in the JSON responses (own lessons, Money, own student names); no new logging.

Verified, live against http://localhost:8104 with two fresh `sec-a-*` / `sec-b-*` teachers:

- **Authorization / IDOR**: every query filters on `Lesson.teacher_id == session.teacher_id` (`_in_month`, `list_pending`, `set_paid`). A's `PATCH /api/lessons/{B's id}` and `PATCH /api/lessons/999999999` both return 404 with the identical body `{"error":{"code":"not_found","message":"Not found","details":{}}}`; B's lesson stayed `paid: false`. Ids `0`, `-1`, `99999999999999999999` return the same 404 (guarded by `1 <= lesson_id <= _INT4_MAX`, no DB overflow error). A's summary, month list and pending list contained only A's lesson.
- **Authentication**: all four endpoints return 401 `not_authenticated` without a session; the global `authenticate_unless_public` dependency covers them and `test_isolation.py` now asserts the new routes are in the all-routes check.
- **Input validation**: `SetPaidRequest` uses `extra="forbid"` + `StrictBool`; `{"paid":true,"price":...,"teacher_id":1}` returns 422 listing both extra fields (no mass assignment). `month` (path and query) is validated by `^20\d{2}-(0[1-9]|1[0-2])$`; `2026-11\n`, `2026-11'`, trailing/leading spaces all 422. `page_size=501` and an oversize `page` are 422.
- **Injection**: ORM only; month converted to `date` bounds via `month_range`, no string-built SQL.
- **CSRF / CORS**: global `require_json_body` rejects `text/plain` PATCH with 415 (ADR-004); session cookie is `SameSite=Lax`; a cross-origin preflight from `https://evil.example` gets no `Access-Control-Allow-*` headers.
- **XSS**: no `dangerouslySetInnerHTML`/`innerHTML`/`eval` in `frontend/src/features/payments`; student names rendered as React text.
- **Sensitive logging**: no logging added in the backend diff; `test_ac5_student_names_are_never_logged_by_the_payment_endpoints` covers it.
- **Negative tests**: present for cross-teacher PATCH (404 + unchanged), unknown/out-of-range ids, no-session 401 on all new endpoints, invalid months 422, invalid/extra-field bodies 422, non-JSON 415 (`backend/tests/test_payments_isolation.py`, `backend/tests/test_mark_paid.py`).
- **Secrets / dependencies**: no dependency files changed; no secrets in the diff (seed credentials are the pre-existing documented local-only ones). `uv run pip-audit`: "No known vulnerabilities found". `npm audit --omit=dev`: "found 0 vulnerabilities". `uv run bandit -r app`: 3 low B101 `assert` in `app/core/errors.py`, pre-existing and outside the diff.

### Summary
No vulnerabilities found. Ownership checks, the identical-404 for foreign and nonexistent lessons, strict PATCH body, month validation and the JSON-only CSRF rule all hold in code and against the running API, with negative tests for each. semgrep was not run (not installed).
