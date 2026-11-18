# Discovery questions: lesson-ledger

Answer inline under each question. Leave "Answer:" empty if unknown; the planner will not proceed until all are answered or marked "skip, use default".

## Delivery and CI
1. The brief says "runs locally only, no deployment in v1", but F00 must reach a green CI pipeline. Where does CI run?
   Options: a) a hosted CI workflow (e.g. GitHub Actions) committed to the repo and run on every PR, plus `make check` / `make e2e` locally b) local only: `make check` and `make e2e` are the gate, no hosted CI config
   Why it matters: defines F00's Expected result (CI stages and where they must pass) and the hosting/CI ADR. Default if skipped: b), since the brief excludes any remote infrastructure.
   Answer: skip, use default (b: local only)

## Scope
2. In the monthly summary, what does "money collected" for a month mean?
   Options: a) sum of lessons dated in that month that are marked paid (the month is always the lesson's month) b) sum of payments received in that month, whatever month the lesson was in (needs a payment date)
   Why it matters: b) adds a paid-on date to the data model and changes how the summary and "mark as paid" behave. Default if skipped: a).
   Answer: skip, use default (a: lessons dated in that month)

3. Can the teacher correct mistakes in v1: edit or delete a student or lesson, and undo "mark as paid"?
   Options: a) none: add, list and mark paid only, as written in the brief b) undo "mark as paid" only c) undo paid plus edit/delete lessons d) all of the above plus edit/delete students
   Why it matters: with the 4-feature cap, c) or d) enlarge the lessons and payments features and may force harder merges. Default if skipped: b), because a one-click irreversible action is likely to be flagged by the UX review.
   Answer: skip, use default (b: undo "mark as paid" only)

## Assumptions (object if wrong)
- A1. The 4-feature cap is met by merging: F00 project base, F01 teacher accounts, F02 students and recording lessons, F03 monthly summary and pending payments with mark as paid.
- A2. "Deployable" for F00 means the full stack (backend, frontend, PostgreSQL) starts with `make up` via docker compose on a developer machine and passes `GET /health`. No remote environment.
- A3. Stack per conventions: FastAPI + SQLAlchemy 2 + Alembic, React (Vite + TypeScript), PostgreSQL, as the brief mandates and the conventions' selection criteria agree (separate SPA, no admin UI needed).
- A4. Accounts: email + password, sign up open to anyone, no email verification and no password reset in v1 (both need email delivery, which is out of scope). Email is unique per account.
- A5. Data isolation: every student and lesson belongs to exactly one teacher; any access to another teacher's data returns 404, enforced on the server.
- A6. Student: name only (required, not unique). No contact details, keeping personal data to names as the brief states.
- A7. Lesson: student, date (calendar date, no time of day), duration in minutes, price in USD stored as integer cents. Price is entered per lesson; there is no per-student default rate.
- A8. Months are calendar months of the lesson date; since lessons have no time of day, no time zone conversion applies.
- A9. Pending payments list shows all unpaid lessons across all months, oldest first, with the total pending.
- A10. Lists are not paginated in the UI (at most 30 students and a few hundred lessons per year); APIs still follow the conventions' pagination format.
- A11. Accessibility "factory defaults" taken as WCAG 2.1 AA for the web UI.
- A12. Seed data is synthetic only, with at least two teachers to exercise data isolation.
