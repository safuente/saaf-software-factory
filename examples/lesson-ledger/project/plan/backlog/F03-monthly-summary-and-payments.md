---
id: F03
project: PRJ-001
type: feature
priority: high
milestone: v1
depends_on: [F02]
touches_frontend: true
adrs: [ADR-001, ADR-002, ADR-003, ADR-004]
---

## Problem
At the end of the month a teacher does not know who has paid them, and feels awkward chasing a payment they are not sure is owed (`context/research.md`). Lessons are recorded, but there is no view of totals, no list of what is still owed and no way to record that a lesson was paid.

## Affected user
Teacher, logged in, reviewing a month's income (typically at month end) and checking or settling who still owes them, often while a student is paying in cash or by transfer.

## Expected result
- The teacher can open a monthly summary that defaults to the current month and can move to previous and next months; it shows the number of lessons given, money collected (paid lessons dated in that month) and money pending (unpaid lessons dated in that month), in USD.
- The monthly summary lists that month's lessons with student, date, duration, price and payment status; a month with no lessons shows an empty state and zero totals.
- The teacher can open a pending payments list showing every unpaid lesson across all months, oldest first, with the total amount pending; when nothing is pending it says so.
- The teacher can mark a lesson as paid from the pending list or the monthly summary; the lesson leaves the pending list and both views' totals update without a full page reload.
- The teacher can undo "mark as paid" on a paid lesson, which returns it to unpaid and to the pending list; marking or undoing twice has no further effect.
- Totals and lists include only the logged-in teacher's lessons; marking or undoing another teacher's lesson through the API gets 404.

## Out of scope
- Payment dates, partial payments, payment methods (`questions.md` Q2).
- Invoices, receipts, reminders, online payments (`brief.md` Out of scope).
- Per-student balances or reports, exports, charts.
- Editing or deleting lessons (`questions.md` Q3).

## Constraints
- "Money collected" and "money pending" are defined by the lesson's month, per `questions.md` Q2 and ADR-003. Totals computed from integer cents.
- Months are calendar months of the lesson date; no time zone conversion (`questions.md` A8). "Current month" is the teacher's local current month in the browser.
- WCAG 2.1 AA, including status conveyed by text, not only by color, and totals updates announced to assistive technology.
- `make seed` must reach: a month with paid and unpaid lessons, a month with no lessons, a teacher with nothing pending, a teacher with pending lessons spanning several months.

## Context
- `brief.md` Main features: "Monthly summary"; "Pending payments list, and mark a lesson as paid".
- `questions.md` Q2, Q3, A8, A9, A10.
- `context/research.md` (problem quotes).
- ADR-003, ADR-004.
