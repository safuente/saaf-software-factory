# ADR-003: Core data model and data isolation

- Status: proposed
- Date: 2026-11-16

## Context
Every v1 feature after F00 reads or writes the same three entities. Inputs:
- `brief.md` Users and roles: each teacher sees only their own students and lessons.
- `brief.md` Main features: a lesson has student, date, duration, price, and starts unpaid. Out of scope: multiple currencies (USD only).
- `questions.md` Q2 (answer a): "money collected" in a month is the sum of paid lessons dated in that month, so no payment date is needed.
- `questions.md` Q3 (answer b): the only correction in v1 is undoing "mark as paid"; no edit or delete of students or lessons.
- `questions.md` A5 to A8: isolation returns 404; student is name only; lesson date is a calendar date, price in integer cents, entered per lesson; months are calendar months of the lesson date.
- `policies/conventions.md` §4: money as integer minor units plus ISO 4217 code; dates ISO 8601.

## Decision
Entities (all with a surrogate id and a UTC `created_at`):

- **Teacher**: email (unique, case-insensitive), password hash. Defined in detail by ADR-004.
- **Student**: owning teacher (required), name (required, trimmed, not unique).
- **Lesson**: owning teacher (required), student (required, must belong to the same teacher), date (calendar date, no time, no time zone), duration in whole minutes (positive), price in USD cents (non-negative integer), paid (boolean, default false).

Rules:
- **Ownership is stored on every row** (lesson carries the teacher as well as the student) and every query is scoped by the authenticated teacher on the server. A record owned by another teacher is reported as not found (404), never 403, so ids do not leak existence.
- **No deletes in v1.** Foreign keys restrict deletion; nothing cascades.
- **Money in the API** is always an object with the integer amount in cents and the currency code `"USD"`, per conventions §4. The database stores cents only; the currency is fixed by this ADR. Formatting to dollars happens in the frontend.
- **Months** are derived from the lesson date (`YYYY-MM`). Summaries never convert time zones because lesson dates have no time component.
- **Paid status** is a boolean with no payment date. Marking paid and undoing it are idempotent state changes on the lesson.

## Alternatives considered
- Ownership only through the student (lesson -> student -> teacher): one fewer column, but every lesson query needs a join to enforce isolation, and an isolation bug is easier to introduce.
- Payment as a separate entity with a date: needed only for answer b of Q2, which was not chosen.
- Price as decimal dollars: rejected by conventions §4.
- Storing a currency column: no second currency is in scope; a later multi-currency change would add it with a migration.

## Consequences
- Every endpoint and every test must cover the "other teacher's record" case and expect 404.
- Lesson creation must verify the student belongs to the same teacher.
- Totals are sums of integer cents; no rounding issues.
- Edit/delete, recurring lessons and payment dates are not supported; adding them later needs new backlog items and, for payment dates, a revision of this ADR.
