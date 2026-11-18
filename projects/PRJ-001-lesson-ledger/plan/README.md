# Plan: lesson-ledger

Status: approved by Santiago Alvarez on 2026-11-16

## Summary
Lesson Ledger is a small web app where an independent music teacher records students and lessons, sees monthly totals of money collected and pending, and marks lessons as paid. It is the factory's pilot, so v1 is capped at 4 features including F00 and runs only on a local docker compose stack, with `make check` and `make e2e` as the CI gate. The stack is a FastAPI backend with PostgreSQL and a React (Vite + TypeScript) single-page app served from the same origin as the API. Authentication uses own email/password accounts with server-side sessions in an HttpOnly cookie, and every record carries its owning teacher so isolation is enforced on the server with 404 for other teachers' data.

## ADRs
| ID | Decision |
|---|---|
| [ADR-001](adr/001-stack.md) | FastAPI + SQLAlchemy 2 + Alembic, React (Vite, TS) with React Router and TanStack Query, PostgreSQL; OpenAPI committed and frontend types generated from it |
| [ADR-002](adr/002-local-environment-and-ci.md) | Local docker compose only (db, backend, frontend proxying `/api`); `make check` / `make e2e` are the CI; no hosted CI or deployment |
| [ADR-003](adr/003-data-model.md) | Teacher, Student, Lesson; ownership on every row, 404 across teachers; USD cents; paid as boolean without payment date; no deletes |
| [ADR-004](adr/004-authentication.md) | Email/password with Argon2id, server-side sessions in an HttpOnly SameSite=Lax cookie, 14-day expiry, no password reset |

## Backlog
| ID | Title | Milestone | Depends on | Frontend |
|---|---|---|---|---|
| [F00](backlog/F00-project-base.md) | Project base | v1 | - | yes |
| [F01](backlog/F01-teacher-accounts.md) | Teacher accounts: sign up, log in, log out | v1 | F00 | yes |
| [F02](backlog/F02-students-and-lessons.md) | Students and recording lessons | v1 | F01 | yes |
| [F03](backlog/F03-monthly-summary-and-payments.md) | Monthly summary, pending payments, mark as paid | v1 | F02 | yes |

Brief feature mapping: account -> F01; students -> F02; record a lesson -> F02; monthly summary -> F03; pending payments and mark as paid -> F03.

## Parallelization
None. The backlog is a single chain, each wave one feature:
1. F00
2. F01
3. F02
4. F03

This is a consequence of the 4-feature cap: students and lessons were merged into F02 and summary and payments into F03, which removed the only pairs that could have run concurrently.

## Risks
- **F02 and F03 are at the upper size limit for one PR** (each merges two brief features, 6 expected results). Mitigation: Spec Writer keeps UI to the minimum screens; if a spec still exceeds one reviewable PR, the plan needs a revision, which the 4-feature cap does not allow without changing the brief.
- **Meaning of `APP_URL` and `API_URL`**: ADR-002 takes `APP_URL` as the frontend origin (where Playwright runs) and `API_URL` as the backend. If the factory's orchestrator assumes `APP_URL` is the backend, e2e tests will point to the wrong service. Confirm before F00 starts.
- **Secure cookie on local HTTP**: ADR-004 disables the `Secure` flag for local HTTP through configuration. Any future deployment must enable it; a misconfigured environment would send session cookies in clear.
- **No login rate limiting and no password reset** (ADR-004): acceptable for a local pilot with synthetic data, must be addressed by new backlog items before any real deployment.
- **Security scan needs network access** for vulnerability databases (ADR-002). Offline runs of `make check` will fail stage 6.
- **Single gate**: with no hosted CI, nothing outside the factory enforces `make check`; a manual merge bypassing the factory would not be checked.
- **Product risk** (`context/research.md`): teachers comfortable with notebooks may not see enough value. Not addressed by the pilot, whose goal is exercising the pipeline.

## Assumptions carried from discovery
From `questions.md` answers:
- Q1: CI is local only; `make check` and `make e2e` are the gate.
- Q2: "money collected" in a month is the sum of paid lessons dated in that month.
- Q3: the only correction in v1 is undoing "mark as paid".

From `questions.md` Assumptions (no objections recorded):
- A1. 4-feature cap met by merging: F00 base, F01 accounts, F02 students and lessons, F03 summary and payments.
- A2. "Deployable" for F00 means the full stack starts with `make up` on a developer machine and passes the health check. No remote environment.
- A3. Stack: FastAPI + SQLAlchemy 2 + Alembic, React (Vite + TypeScript), PostgreSQL.
- A4. Open sign-up, email unique, no email verification, no password reset.
- A5. Every student and lesson belongs to one teacher; cross-teacher access returns 404, enforced on the server.
- A6. Student has a name only.
- A7. Lesson: student, calendar date, duration in minutes, price in USD cents entered per lesson.
- A8. Months are calendar months of the lesson date; no time zone conversion.
- A9. Pending payments list shows all unpaid lessons across months, oldest first, with the total.
- A10. No pagination in the UI; APIs follow the conventions' pagination format.
- A11. Accessibility target WCAG 2.1 AA.
- A12. Seed data synthetic only, with at least two teachers.

Added during planning:
- P1. `APP_URL` is the frontend origin and `API_URL` the backend base URL; the frontend server proxies `/api` to the backend (ADR-002).
- P2. Sessions expire 14 days after creation (ADR-004).
- P3. "Current month" in the monthly summary is the teacher's local month as seen by the browser (F03).
- P4. Synchronous SQLAlchemy sessions and plain CSS without a component library (ADR-001).
