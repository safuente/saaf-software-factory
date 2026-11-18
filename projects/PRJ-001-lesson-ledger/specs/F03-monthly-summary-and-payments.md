---
id: F03
project: PRJ-001
entry: projects/PRJ-001-lesson-ledger/plan/backlog/F03-monthly-summary-and-payments.md
status: approved
version: 1
touches_frontend: true
adrs: [ADR-001, ADR-002, ADR-003, ADR-004]
---

# Monthly summary, pending payments, mark as paid

## Summary
A logged-in teacher gets a Monthly summary page (defaulting to the browser's current month, with previous/next navigation) showing the month's lesson count, money collected and money pending in USD, and the month's lessons with their payment status. A Pending payments page lists every unpaid lesson across all months, oldest first, with the total pending. From either page the teacher can mark a lesson as paid, and from the summary undo it; totals update in place. Everything is scoped to the logged-in teacher; another teacher's lesson is 404.

## Acceptance criteria
- **AC-1**: Given a logged-in teacher whose lessons in November 2026 are A (`2026-11-03`, 4250 cents, paid), B (`2026-11-10`, 6000, unpaid) and C (`2026-11-10`, 0, unpaid), plus one unpaid lesson dated `2026-10-31` and one dated `2026-12-01`, and a browser date of 2026-11-18, when they open `/summary`, then the page shows `h2` "November 2026", "Lessons: 3", "Collected: $42.50", "Pending: $60.00", and a table of exactly A, B, C in lesson order (newest first; same date newest created first) with columns Student, Date, Duration, Price, Status, Action, status as the text "Paid" or "Unpaid"; `GET /api/monthly-summaries/2026-11` returns `{"month": "2026-11", "lesson_count": 3, "collected": {"amount": 4250, "currency": "USD"}, "pending": {"amount": 6000, "currency": "USD"}}`. When they activate "Previous month", then without a full page reload the URL becomes `/summary?month=2026-10`, the heading "October 2026" and that month's totals and lessons are shown; "Next month" twice from there shows "December 2026". Given a month with no lessons (e.g. `/summary?month=2026-08`), then it shows "Lessons: 0", "Collected: $0.00", "Pending: $0.00" and "No lessons in August 2026." in place of the table, and the API returns `lesson_count` 0 and both amounts 0.
- **AC-2**: Given a logged-in teacher with unpaid lessons dated `2026-09-05` (3375 cents), `2026-10-10` (4500, created first), `2026-10-10` (125000, created second) and `2026-11-03` (4250), and one paid lesson, when they open `/pending`, then the page shows "Total pending: $1,371.25 across 4 lessons" and a table with exactly the 4 unpaid lessons in the order `2026-09-05`, `2026-10-10` (4500), `2026-10-10` (125000), `2026-11-03`, with columns Student, Date, Duration, Price, Action; `GET /api/pending-lessons` returns those items in that order with `"total": 4` and `"amount_pending": {"amount": 137125, "currency": "USD"}`. Given a teacher with no unpaid lessons (with or without paid ones), the page shows "Nothing pending. Every lesson is paid." and no table, and the API returns `items: []`, `total` 0, `amount_pending.amount` 0.
- **AC-3**: Given the teacher of AC-2 on `/pending`, when they activate "Mark as paid" on the `2026-10-10` 4500-cent lesson, then `PATCH /api/lessons/{id}` with `{"paid": true}` returns 200 with `"paid": true`; without a full page reload the row disappears, the total reads "Total pending: $1,326.25 across 3 lessons", a `role="status"` region announces "Marked {student}'s lesson on Oct 10, 2026 as paid. Total pending: $1,326.25.", and focus moves to the "Mark as paid" button of the next row (or the previous row if it was last, or the `h1` if the list became empty). Given the same teacher on `/summary?month=2026-10`, when they activate "Mark as paid" on an unpaid row, then that row's status becomes "Paid", its button becomes "Undo paid" and keeps focus, Collected and Pending change by the lesson's price, and the status region announces "Marked as paid. Collected: {amount}, pending: {amount}."; when they then activate "Undo paid", `PATCH` with `{"paid": false}` returns 200 `"paid": false`, the row returns to "Unpaid" / "Mark as paid", totals revert, "Marked as unpaid. Collected: {amount}, pending: {amount}." is announced, and the lesson is back in `/pending` and `GET /api/pending-lessons`.
- **AC-4**: Given a lesson already paid, when `PATCH /api/lessons/{id}` with `{"paid": true}` is sent twice, then both return 200 with the same lesson body and `paid: true`, and the summary totals are the same as after the first call; the same holds for `{"paid": false}` on an unpaid lesson. When the body is `{}`, `{"paid": "yes"}`, `{"paid": null}`, or contains any field other than `paid` (e.g. `{"paid": true, "price": {"amount": 1, "currency": "USD"}}`), then it returns 422 `validation_error` and the lesson is unchanged. When a non-JSON body is sent, it returns 415 `unsupported_media_type`.
- **AC-5**: Given teachers A and B, each with paid and unpaid lessons in November 2026, when A calls `GET /api/monthly-summaries/2026-11`, `GET /api/lessons?month=2026-11` and `GET /api/pending-lessons`, then counts, amounts and items include only A's lessons, and A's `/summary` and `/pending` never show B's student names. When A sends `PATCH /api/lessons/{id}` for B's lesson, or for an id that exists for no teacher (e.g. 999999999), then both return 404 with the identical body `{"error": {"code": "not_found", "message": "Not found", "details": {}}}` and B's lesson is unchanged. Without a session, all three new or changed endpoints return 401 `not_authenticated`. `GET /api/monthly-summaries/{month}` and `GET /api/lessons?month=` with `2026-13`, `2026-1`, `1999-12`, `2100-01` or `abc` return 422 `validation_error`.
- **AC-6**: Given the backend is unreachable or answers 5xx, when `/summary` or `/pending` loads, then the page shows "We couldn't reach Lesson Ledger." with a "Try again" button that repeats the load; when "Mark as paid" or "Undo paid" fails that way, then "We couldn't reach Lesson Ledger. Please try again." appears in a `role="alert"` region, the row, status and totals are unchanged, and focus is on the same (re-enabled) button; a 404 on that request shows "That lesson could not be found. Reload the page and try again." the same way. And given any database state, when `make seed` runs twice in a row, then it exits 0 each time and afterwards: alice's lessons in the previous calendar month (server date) are 2 paid and 2 unpaid, in the current month 1 paid and 3 unpaid, in two months back 4 unpaid; alice has no lessons three months back; bob has nothing pending (0 lessons); carol has more than 500 unpaid lessons; README's seed section describes these states.

## Behavior
- **Pages**: `/summary` and `/pending` are new app pages (session required, as F01/F02). Default chosen: the "Main" navigation becomes "Home", "Lessons", "Students", "Monthly summary" (`/summary`), "Pending payments" (`/pending`), with `aria-current="page"` as in F02.
- **Month selection**: `/summary` reads `?month=YYYY-MM`. Missing → the browser's local current month (P3). Default chosen: an invalid or out-of-range value (outside 2000-01 to 2099-12, the F02 date range) shows the current month and replaces the URL with `?month=<current>` (no history entry). "Previous month" / "Next month" push a history entry so Back returns to the previous month; they are disabled at 2000-01 and 2099-12 respectively. Navigation into the future is allowed.
- **Month boundaries**: a lesson belongs to the month of its `date` (`YYYY-MM`), no time zone conversion (ADR-003, A8).
- **Totals** (ADR-003, Q2): `lesson_count` = all of the teacher's lessons dated in the month; `collected` = sum of `price` of those that are paid; `pending` = sum of those that are unpaid. `amount_pending` on the pending list = sum of all the teacher's unpaid lessons across all months. All sums in integer cents, computed on the server over all matching lessons, independent of how many items a page shows.
- **Orders**: summary table uses the F02 lesson order (date newest first; same date newest created first), Default chosen for consistency with `/lessons`. Pending list: date oldest first; same date oldest created first (A9).
- **Mark / undo**: setting `paid` to the value it already has is a no-op returning 200 (ADR-003 idempotent). No other lesson field can change (Q3). Concurrent changes from two tabs: last request wins; each page shows the state of its own successful response and refreshes its lists and totals from the server afterwards. Undo is offered only on `/summary` (on `/pending` paid lessons are not listed); Default chosen: the pending page's success message does not include an undo action.
- **In flight**: while a mark/undo request is pending its button is disabled and labelled "Saving…", so a double click sends one request; other rows stay usable.
- **Button names**: visible text "Mark as paid" / "Undo paid"; accessible name includes the row, e.g. "Mark as paid: Zoe Park, Nov 3, 2026" / "Undo paid: Zoe Park, Nov 3, 2026".
- **Display formats**: as F02 (`shared` formats: `Nov 3, 2026` in `time`, "{n} min", "$1,250.00"). Month heading en-US "November 2026". Pending total "Total pending: {amount} across {n} lesson(s)" ("1 lesson" singular).
- **List sizes** (A10): pages request `page=1&page_size=500`. If `total` > 500: summary ends with "Showing the 500 most recent of {total} lessons in {Month YYYY}."; pending ends with "Showing the 500 oldest of {total} pending lessons." Totals always cover all lessons.
- **Failures**: load failures and 401 handling as F02 (`LoadError` "Try again"; any 401 → `/login`). If the summary totals and the summary list load separately and only one fails, the whole page shows the load error.
- **Seed** (changes F02's "all lessons unpaid" for alice; F02's seed test is updated accordingly): alice keeps 6 students and 12 lessons with F02's dates and prices; paid are 2 lessons of the previous month and 1 of the current month (Default chosen: in the previous month the 6000-cent day-3 lesson and the 125000-cent day-10 lesson; in the current month the day-2 lesson), so the previous and current months mix paid and unpaid and pending spans three months. bob stays with 0 students and 0 lessons (nothing pending, empty month). carol keeps 520 unpaid lessons (pending "Many items").
- **Logging**: no student names in logs, as F02.

## Interfaces

### API
All endpoints require a session (401 `not_authenticated` otherwise), are scoped to the session's teacher, and use the conventions §4 error body. Lesson and Money objects as in F02.

- `GET /api/monthly-summaries/{month}`: `month` = `YYYY-MM`, 2000-01 to 2099-12. 200 `{"month": "2026-11", "lesson_count": integer, "collected": Money, "pending": Money}`; 422 `validation_error` for an invalid month.
- `GET /api/lessons?month=&page=&page_size=` (changed): new optional `month` (`YYYY-MM`, same rules) filters to lessons dated in that month; without it behavior is unchanged from F02. Same order and envelope. 422 `validation_error` for an invalid month or paging.
- `GET /api/pending-lessons?page=&page_size=`: 200 `{"items": [Lesson], "total": n, "page": n, "page_size": n, "amount_pending": Money}`, unpaid lessons only, pending order; paging rules as F02 (422 otherwise).
- `PATCH /api/lessons/{id}`: request `{"paid": boolean}` (exactly this field; other fields → 422). 200 Lesson; 404 `not_found` ("Not found") for another teacher's or nonexistent lesson, including ids outside the integer range; 422 `validation_error` for a non-integer id or an invalid body; 415 for non-JSON.
- OpenAPI schema and generated frontend types updated (ADR-001).

### Data model
No schema change: `lesson.paid` exists (F02). Month and unpaid queries by teacher must not scan other teachers' rows.

## UI
Shared: as F02 (`html lang="en"`, `main`, one `h1`, "Main" navigation, tokens, F02 table styling). Document titles "Monthly summary · Lesson Ledger", "Pending payments · Lesson Ledger".

**`/summary`**
- **Loading**: "Loading…" in a `role="status"` region in place of totals and table; month heading and navigation shown.
- **Default**: `h1` "Monthly summary"; month navigation ("Previous month", `h2` "{Month YYYY}", "Next month"); totals as a description list Lessons / Collected / Pending; table with caption "Lessons in {Month YYYY}, newest first", columns Student, Date, Duration, Price, Status, Action.
- **Empty**: totals at 0 and "No lessons in {Month YYYY}."
- **Saving**: the row's button disabled, "Saving…".
- **Success**: status and button toggle, totals update, announcement of AC-3.
- **Error**: load error with "Try again"; mark/undo errors of AC-6 in `role="alert"`.
- **Many items**: truncation message of Behavior.
- **No permission**: no or expired session redirects to `/login`.

**`/pending`**
- **Loading**: "Loading…" in a `role="status"` region.
- **Default**: `h1` "Pending payments"; "Total pending: … across n lessons"; table with caption "Unpaid lessons, oldest first", columns Student, Date, Duration, Price, Action.
- **Empty**: "Nothing pending. Every lesson is paid."
- **Saving**: the row's button disabled, "Saving…".
- **Success**: row removed, total updated, announcement and focus of AC-3.
- **Error**: as `/summary`.
- **Many items**: truncation message of Behavior.
- **No permission**: redirect to `/login`.

## Security considerations
- **Access**: new and changed endpoints require a session (default-deny from F02 already covers new routes; the all-routes test must include them).
- **Isolation** (ADR-003): summaries, month filter and pending list are computed only over the session teacher's lessons; PATCH on another teacher's lesson is 404 with the same body as a nonexistent id, and does not change it.
- **User input**: `month` path/query value, paging, lesson id, PATCH body (`paid` boolean only; any other field rejected so no other lesson data can be modified).
- **CSRF**: PATCH is state-changing; JSON body only (415 otherwise) per ADR-004.
- **Personal data**: student names, shown only to their teacher, never logged. Aggregates reveal only the teacher's own income.
- **Abuse**: no rate limiting in v1 (plan Risks); paging capped at 500.

## Non-functional
- WCAG 2.1 AA: `/summary` (default, empty, error) and `/pending` (default, empty, error) report 0 axe-core violations for wcag2a, wcag2aa, wcag21aa; paid status conveyed by text; total updates announced via `role="status"`; all controls keyboard-operable with visible focus; focus never lost to `body` after mark/undo.
- No horizontal scrolling at 1280 px and 768 px wide.
- On the local stack, for a teacher with 5,000 lessons: `GET /api/monthly-summaries/{month}` and `GET /api/pending-lessons?page_size=500` respond in under 500 ms at p95.
- Interface text in English (US).

## Out of scope
- Payment dates, partial payments, payment methods (Q2).
- Invoices, receipts, reminders, online payments (brief).
- Per-student balances or reports, exports, charts.
- Editing or deleting lessons (Q3); mark/undo is the only lesson change.
- Mark or undo from `/lessons` (stays read-only for status).
- Undo action directly on `/pending`.
- Bulk "mark all as paid".
- UI pagination beyond the 500-item truncation message (A10).

## Traceability
| Expected result | Criteria |
|---|---|
| Monthly summary, current month default, previous/next, count, collected, pending in USD | AC-1 |
| Month's lessons with student, date, duration, price, status; empty month with zero totals | AC-1 |
| Pending list across months, oldest first, total; empty message | AC-2 |
| Mark as paid from pending or summary; leaves pending; totals update without reload | AC-3, AC-6 |
| Undo returns to unpaid and pending; repeated mark/undo has no further effect | AC-3, AC-4 |
| Only own lessons in totals and lists; 404 for another teacher's lesson | AC-5 |

## Open questions
None.

## Changelog
