---
feature: F02
project: PRJ-001
reviewer: security
round: 3
verdict: pass
blocking: 0
suggestions: 0
reviewed: feature/F02-students-and-lessons @ ce82bf4507345e1c74cfb393288aa35a8c379dd8
---

# Security review: F02 Students and recording lessons

## Round 1

### Findings

None.

### What was verified

Attack surface in the diff: `GET/POST /api/students`, `GET/POST /api/lessons`, the app-wide `authenticate_unless_public` dependency (`backend/app/accounts/auth.py`), migration 0003, the seed script, and the `/students` and `/lessons` pages.

- **Authentication (default-deny)**: `authenticate_unless_public` is registered as the first app-wide dependency in `backend/app/main.py` and denies anything that is not an exact `(method, path)` match in `PUBLIC_ROUTES`. Probed live without a cookie and with cookie `not-a-real-token`: `GET /api/students`, `POST /api/students` and `POST /api/lessons` return 401 `not_authenticated`, and `POST /api/lessons` answers 401 before body validation. Path variants such as `/API/students`, `/api//students` and trailing slashes fail closed (404 or 307), with no bypass. `backend/tests/test_isolation.py` enumerates every registered route and also covers a route added without any auth declaration.
- **Authorization / IDOR**: `find_student` filters on `id` and `teacher_id`, and both lists filter on `teacher_id`. Live check with two new teachers, `sec-a-r1@example.com` and `sec-b-r1@example.com`: when A records a lesson with B's student id (627), the response is `404 {"error":{"code":"not_found","message":"Not found","details":{}}}`. A nonexistent id (999999999), `-1` and `99999999999999999999` all return the same body. A's lists contain only A's records. The composite FK `(student_id, teacher_id) -> student(id, teacher_id)` enforces this in the database too. Negative tests exist for 404 isolation, list isolation, the DB constraint and the 401 enumeration.
- **Input validation**: Pydantic `StrictInt` bounds, a strict ISO date regex plus range check, `Literal["USD"]`, the name trim/length/Cc rule, and paging capped at `page_size` <= 500 and `page` <= 2^31-1. Live: `page_size=501` returns 422, `page=2147483647` returns 200 with empty items, a `text/plain` body returns 415, and the invalid lesson body returns 422 with no echoed values. Mass assignment: sending `paid: true, teacher_id: 1` is ignored (lesson created with `paid: false` and owned by the session's teacher).
- **Injection / XSS**: data access is ORM-only with no string-built SQL. The frontend has no `dangerouslySetInnerHTML`, `innerHTML` or `eval`. A student named `<img src=x onerror=alert(1)>` is stored as text and rendered by React as text. The CSP on the app (`default-src 'self'; frame-ancestors 'none'; ...`) is unchanged.
- **Data exposure / logging**: responses carry only the spec's fields. Validation `details` contain only `loc`, `msg` and `type`, never the input. DB errors log only the class and SQLSTATE. The request log line contains method, path, status and duration only. `test_ac5_student_names_are_never_logged` covers names in bodies, in validation failures and in the logs.
- **Secrets**: the only credentials added are synthetic test and seed passwords that the README already documents as local-only (`correct-horse-1`, `bob-ledger-pass1`). No keys or tokens.
- **CSRF/CORS**: JSON-only POSTs (415 otherwise) per ADR-004. CORS was not changed.
- **Dependencies**: no dependency or lock-file changes in the diff.

Tooling, run from the worktree:
- `uv run pip-audit`: "No known vulnerabilities found".
- `uv run bandit -q -r app -ll`: no medium or high findings.
- `npm audit --omit=dev`: "found 0 vulnerabilities".
- `semgrep`: not installed, not run.

### Summary

No vulnerabilities found. Default-deny authentication, per-teacher scoping with identical 404s, and boundary validation are all implemented as the spec's Security considerations require, have negative tests, and were confirmed against the running API with two new `sec-*` teachers. Verdict: pass.

## Round 2

### Previous findings

None: round 1 had no findings.

### Findings

None.

### What was verified

Changes since `88309e2`: commits `83d47fc` (tests) and `1c86b0c` (UI-1/UI-2 fix), touching `frontend/src/features/lessons/LessonsPage.tsx`, `frontend/src/shared/ui/ui.module.css`, `frontend/src/features/lessons/LessonsPage.test.tsx` and `frontend/e2e/accessibility.spec.ts`.

- The production change wraps the lessons table in a `role="region"` scroll container with `tabIndex={0}` and adds `.tableScroll`/`.nowrap` CSS classes. User data (`lesson.student.name`) is still rendered as React text children. No raw HTML sink, new entry point, data flow, request or auth logic was added.
- No backend, dependency, lock-file, config or migration changes. The round 1 tooling results (pip-audit, bandit, npm audit) still apply, so they were not re-run. semgrep is not installed.

### Summary

The round 2 changes are presentational only and have no security impact. The round 1 assessment stands: no open findings. Verdict: pass.

## Round 3

### Previous findings

None: rounds 1 and 2 had no findings.

### Findings

None.

### What was verified

Changes since `1c86b0c`: commits `d0878e9` (test) and `ce82bf4` (APR-1 fix), touching `backend/app/seed.py`, `README.md`, `backend/tests/test_ac6_seed.py` and `backend/tests/test_seed_ledger.py`.

- **Entry points**: none added or changed. `seed.py` runs only through `make seed` (`$(TASK) seed`). It is not imported by the app and not reachable over HTTP.
- **Secrets**: the new `carol@example.com` / `carol-ledger-pass` credential is synthetic and documented in the README as local-only. It follows the same pattern as the alice/bob seed accounts accepted in round 1. No keys or tokens.
- **Injection**: the bulk inserts use SQLAlchemy `insert(...)` with parameter lists. No string-built SQL. All values are constants or derived from the server date.
- **Isolation**: every generated student and lesson row gets carol's `teacher_id`, and each lesson's `student_id` comes from carol's own returned student ids. This satisfies the composite FK and creates no cross-teacher rows.
- **Dependencies/config**: no dependency, lock-file, config, migration or CORS changes. The round 1 tooling results (pip-audit, bandit, npm audit) still apply, so they were not re-run. semgrep is not installed.

### Summary

The round 3 changes add local review seed data only and have no security impact. No open findings. Verdict: pass.
