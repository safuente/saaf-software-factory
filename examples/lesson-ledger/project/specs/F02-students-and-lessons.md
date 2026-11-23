---
id: F02
project: PRJ-001
entry: projects/PRJ-001-lesson-ledger/plan/backlog/F02-students-and-lessons.md
status: approved
version: 1
touches_frontend: true
adrs: [ADR-001, ADR-002, ADR-003, ADR-004]
---

# Students and recording lessons

## Summary
A logged-in teacher can add students by name and see them sorted by name on a Students page, and can record a lesson (student, date, duration, price in USD) on a Lessons page, where their lessons are listed newest first with formatted price and an "Unpaid" status. A teacher only ever sees and uses their own students; the API answers 404 to references to another teacher's student. Every API endpoint is now protected by default: only an explicit public allow-list works without a session (SEC-1 from F01). `make seed` gives `alice@example.com` a populated history and leaves `bob@example.com` empty.

## Acceptance criteria
- **AC-1**: Given a logged-in teacher with no students, when they open `/students`, then the page shows `h1` "Students", the add form, and the empty state "You have no students yet. Add your first student with the form above." When they add ` Zoe Park ` and then `adam Lee`, then each `POST /api/students` returns 201 with the trimmed name, the Name field is emptied and focused, "Student added." is announced in a `role="status"` region, and the list shows `adam Lee`, `Zoe Park` in that order (case-insensitive) without a page reload; `GET /api/students` returns `{"items": [...], "total": 2, "page": 1, "page_size": 50}` in the same order. When they submit an empty or whitespace-only name, or a name of 101 characters, then no request is sent and the field shows "Enter the student's name." or "Name must be 100 characters or fewer." respectively (associated via `aria-describedby`, `aria-invalid="true"`, focus on the field), and the error disappears as soon as the field's value changes; the same values sent directly to `POST /api/students` return 422 `validation_error` and no student is stored.
- **AC-2**: Given a logged-in teacher with student `Zoe Park`, when on `/lessons` they choose `Zoe Park`, set date `2026-11-03`, duration `45` and price `42.5` and submit "Record lesson", then `POST /api/lessons` with `{"student_id": <Zoe's id>, "date": "2026-11-03", "duration_minutes": 45, "price": {"amount": 4250, "currency": "USD"}}` returns 201 with `"paid": false`; "Lesson recorded." is announced in a `role="status"` region; and, without a page reload, the lessons table shows a row `Zoe Park | Nov 3, 2026 | 45 min | $42.50 | Unpaid`. Given lessons dated `2026-10-28`, `2026-11-03` and `2026-11-10`, the table and `GET /api/lessons` list them in the order `2026-11-10`, `2026-11-03`, `2026-10-28`; a price of 125000 cents is shown as `$1,250.00`, 0 cents as `$0.00`. Given a teacher with students but no lessons, the table area shows "No lessons recorded yet."
- **AC-3**: Given a logged-in teacher with at least one student on `/lessons`, when they submit the form with, one at a time: no student chosen; an empty date; duration `0`, `-5`, `45.5` or `601`; price `-1`, `12.345`, `abc`, `$45` or `10000.01`; then no request is sent and the field shows respectively "Choose a student.", "Enter the lesson date.", "Enter the duration in whole minutes, from 1 to 600.", and "Enter a price in dollars, like 45 or 45.50." (for `10000.01`: "Price must be $10,000.00 or less."), with the association, focus and clear-on-change behavior of AC-1. Sending directly to `POST /api/lessons` a body with `duration_minutes` 0 or 601, `price.amount` -1, 1000001 or `42.5`, `price.currency` `"EUR"`, `date` `"2026-02-30"` or `"1999-12-31"`, or a missing field returns 422 `validation_error` and stores nothing. When the backend is unreachable or answers 5xx on submit, then the form shows "We couldn't reach Lesson Ledger. Please try again." in a `role="alert"` region, keeps every entered value, and focus is on the "Record lesson" button (never on `body`); the same applies to the add-student form with its "Add student" button.
- **AC-4**: Given a logged-in teacher with no students, when they open `/lessons`, then instead of the form the page shows "Add a student before recording a lesson." and a link "Add a student" that leads to `/students`, and the table area shows "No lessons recorded yet."; no student selector or "Record lesson" button is rendered.
- **AC-5**: Given teachers A and B, each with one student and one lesson, when A calls `GET /api/students` and `GET /api/lessons`, then only A's student and lesson are returned (`total` 1 each), and A's `/students` and `/lessons` pages never show B's student name. When A sends `POST /api/lessons` with B's student id, or with an id that exists for no teacher, then both return 404 with the identical body `{"error": {"code": "not_found", "message": "Not found", "details": {}}}` and no lesson is stored. Without a session cookie (and with cookie `not-a-real-token`), every route of the API except `GET /health`, `GET /api/health`, `POST /api/teachers` and `POST /api/sessions` returns 401 `not_authenticated`, verified by a test that enumerates all registered routes, so a route added later without any authentication declaration also returns 401.
- **AC-6**: Given any database state, when `make seed` runs (twice in a row), then it exits 0 each time and afterwards: `alice@example.com` has exactly 6 students and exactly 12 lessons, at least 3 lessons dated in each of the current calendar month and the two previous ones (server date at seed time), at least two lessons sharing a date, at least one price with non-zero cents, and all lessons unpaid; `bob@example.com` has 0 students and 0 lessons; the F01 credentials still log in; and the README seed section describes both states.

## Behavior
- **Pages** (client-side, session required as in F01): `/students` and `/lessons` are new app pages. `/` keeps its F01 content. Default chosen: every app page (`/`, `/students`, `/lessons`) shows a navigation landmark labelled "Main" with links "Home" (`/`), "Lessons" (`/lessons`) and "Students" (`/students`); the link of the current page has `aria-current="page"`. Log out stays on `/` only.
- **Student name** (Default chosen): leading and trailing whitespace removed; inner whitespace kept as entered; 1 to 100 characters after trimming, counted as Unicode code points; control characters (Unicode category Cc, e.g. tab, newline) rejected with 422 and, in the UI, "Name can't contain tabs or line breaks."; duplicates allowed (ADR-003).
- **Student order**: by name compared case-insensitively, ties by creation order (oldest first).
- **Lesson fields** (Defaults chosen, ADR-003 bounds): `date` a real calendar date from 2000-01-01 to 2099-12-31 inclusive, no time zone; future dates allowed within that range. `duration_minutes` an integer from 1 to 600. `price.amount` an integer number of cents from 0 to 1,000,000 ($10,000.00); `price.currency` must be `"USD"`. `student_id` must be a student of the logged-in teacher, otherwise 404 `not_found` (same body whether the student is another teacher's or does not exist). Payment status is always unpaid on creation; the request has no `paid` field and an extra `paid` field is ignored.
- **Form inputs**: the student is a select with first option "Choose a student" (no student preselected), listing the teacher's students in the student order. Date is a date input that defaults to the browser's local today; out-of-range dates show "Enter a date between Jan 1, 2000 and Dec 31, 2099." Duration is a text input with numeric keyboard (`inputmode="numeric"`), accepted when it is a whole number 1-600 after trimming. Price is a text input labelled "Price (USD)", accepted when, after trimming, it matches digits with an optional `.` and 1 or 2 decimal digits (e.g. `45`, `45.5`, `45.50`); converted to cents exactly (no floating-point rounding). No `$`, commas, signs or exponents.
- **After a successful submit**: add-student clears and focuses the Name field. Record-lesson keeps the chosen date, clears student, duration and price, and focuses the student select (Default chosen: teachers often record several lessons of the same day). The new item appears in the list without a full page reload.
- **Lesson order**: by date, newest first; same date ordered by creation, newest first.
- **Display formats** (en-US): date as `MMM D, YYYY` (e.g. "Nov 3, 2026") inside a `time` element with `datetime="2026-11-03"`, no time zone conversion; duration as "{n} min"; price as US dollars with two decimals and thousands separators ("$1,250.00"), formatted from cents; status as the text "Unpaid" (F03 adds "Paid").
- **Field errors** (UX-3 from F01): a field's error and `aria-invalid` are removed as soon as that field's value changes; other fields' errors stay until the next submit. The server's 422 for a field the client already validates is shown as that field's client message.
- **Focus** (UX-1 from F01): after a submit, focus is never left on `body`: on field errors it moves to the first invalid field; on a form-level error it is on the (re-enabled) submit button; on success as described above.
- **Submitting state**: while a request is in flight the submit button is disabled and labelled "Adding…" / "Recording…", so a double click sends one request.
- **Failure messages** (consistency with F01's home page, user observation on F01): in F02, a network error or 5xx on a form submit shows "We couldn't reach Lesson Ledger. Please try again." in a `role="alert"` region; a failed list load (network or 5xx) shows "We couldn't reach Lesson Ledger." with a "Try again" button that repeats the load, as F01's home page does. Any 401 sends the teacher to `/login` (F01). A 404 on record-lesson (student no longer visible) shows "That student could not be found. Reload the page and try again." in the alert region. F01's login and sign-up messages are not changed by F02 (see Out of scope).
- **List sizes** (A10, no UI pagination): the pages request `page=1&page_size=500`. If `total` exceeds the items shown, the list ends with "Showing the first 500 of {total} students." / "Showing the 500 most recent of {total} lessons." The student select uses the same 500 students.
- **Pagination parameters**: `page` integer ≥ 1, default 1; `page_size` integer 1 to 500, default 50; other values return 422 `validation_error`. A page past the end returns `items: []` with the real `total`.
- **Default-deny authentication** (SEC-1 from F01): authentication is required by default for every API route; a route is public only by being on an explicit allow-list (`GET /health`, `GET /api/health`, `POST /api/teachers`, `POST /api/sessions`). Unknown paths keep their current 404/405 behavior.
- **Seed**: `make seed` keeps the F01 accounts and passwords and resets alice's and bob's students and lessons to exactly the seeded state (Default chosen: re-running replaces their data, so review and e2e data created on these two accounts does not accumulate; e2e tests create their own teachers). Lesson dates are computed relative to the server date when the seed runs. Student names are synthetic. The "students but no lessons" state of `/lessons` is reached by logging in as bob and adding one student.
- **Logging**: student names never appear in logs, including request bodies, validation error details and database errors (class + SQLSTATE only, as in F01). Validation error `details` never echo submitted values.

## Interfaces

### API
All bodies JSON; errors use the conventions §4 body; non-JSON POST bodies return 415 `unsupported_media_type` (F01). All endpoints below require a session: 401 `not_authenticated` otherwise. Every query is scoped to the session's teacher.

Student object:
```json
{"id": 12, "name": "Zoe Park", "created_at": "2026-11-17T10:00:00Z"}
```

Lesson object:
```json
{
  "id": 40,
  "student": {"id": 12, "name": "Zoe Park"},
  "date": "2026-11-03",
  "duration_minutes": 45,
  "price": {"amount": 4250, "currency": "USD"},
  "paid": false,
  "created_at": "2026-11-17T10:05:00Z"
}
```
`date` is `YYYY-MM-DD` with no time zone; `created_at` ISO 8601 UTC.

- `GET /api/students?page=&page_size=`: 200 `{"items": [Student], "total": n, "page": n, "page_size": n}` in student order; 422 `validation_error` for invalid paging.
- `POST /api/students`: request `{"name": string}`; 201 Student; 422 `validation_error`.
- `GET /api/lessons?page=&page_size=`: 200 `{"items": [Lesson], "total": n, "page": n, "page_size": n}` in lesson order; 422 `validation_error` for invalid paging.
- `POST /api/lessons`: request `{"student_id": integer, "date": "YYYY-MM-DD", "duration_minutes": integer, "price": {"amount": integer, "currency": "USD"}}`; 201 Lesson; 404 `not_found` ("Not found") when the student is not the teacher's; 422 `validation_error` (rules in Behavior).
- OpenAPI schema and generated frontend types updated (ADR-001).

### Data model
New reversible migration:
- **student**: `id` integer surrogate key; `teacher_id` references teacher, not null, delete restricted; `name` text, not null, 1-100 characters; `created_at` timestamp with time zone (UTC), not null.
- **lesson**: `id` integer surrogate key; `teacher_id` references teacher, not null, delete restricted; `student_id` references student, not null, delete restricted; `date` date, not null; `duration_minutes` integer, not null, 1-600; `price_cents` integer, not null, 0-1,000,000; `paid` boolean, not null, default false; `created_at` timestamp with time zone (UTC), not null.
- The database itself rejects a lesson whose student belongs to a different teacher than the lesson's `teacher_id`, and enforces the ranges above (not only the API).
- Lists by teacher in the orders of Behavior must not require scanning other teachers' rows.
No existing data to migrate.

## UI
Shared: `html lang="en"`, `main` landmark with one `h1`, the "Main" navigation of Behavior, F01 design tokens and form field component reused. Document titles: "Students · Lesson Ledger", "Lessons · Lesson Ledger".

**`/students`**
- **Loading**: "Loading…" in a `role="status"` region in place of the list; the add form is shown.
- **Default**: `h1` "Students"; form with `h2` "Add a student", labelled field "Name", button "Add student"; `h2` "Your students" followed by a list (`ul`) of names.
- **Empty**: "You have no students yet. Add your first student with the form above."
- **Submitting**: button disabled, label "Adding…".
- **Field errors**: messages of AC-1 and Behavior under the field.
- **Error**: submit failure "We couldn't reach Lesson Ledger. Please try again." (`role="alert"`); list load failure "We couldn't reach Lesson Ledger." with "Try again".
- **Success**: "Student added." (`role="status"`), name appears in the list in order.
- **Many items**: list truncation message of Behavior when `total` > 500.
- **No permission**: no or expired session redirects to `/login`.

**`/lessons`**
- **Loading**: "Loading…" in a `role="status"` region; the form is not rendered until the students have loaded.
- **Default**: `h1` "Lessons"; form with `h2` "Record a lesson", fields "Student" (select), "Date" (date), "Duration (minutes)", "Price (USD)", button "Record lesson"; `h2` "Your lessons" followed by a table with caption "Your lessons, newest first" and column headers Student, Date, Duration, Price, Status.
- **No students**: form replaced by "Add a student before recording a lesson." and link "Add a student" to `/students` (AC-4).
- **Empty**: "No lessons recorded yet." in place of the table.
- **Submitting**: button disabled, label "Recording…".
- **Field errors**: messages of AC-3 and Behavior under each field.
- **Error**: submit failure and 404 messages of Behavior (`role="alert"`); load failure "We couldn't reach Lesson Ledger." with "Try again".
- **Success**: "Lesson recorded." (`role="status"`), new row in the table at its sorted position.
- **Many items**: truncation message of Behavior when `total` > 500.
- **No permission**: no or expired session redirects to `/login`.

**`/`**: unchanged except for the "Main" navigation.

## Security considerations
- **Access**: every F02 endpoint requires a valid session (ADR-004). Authentication becomes default-deny for the whole API: only `GET /health`, `GET /api/health`, `POST /api/teachers`, `POST /api/sessions` are public, and a test over all registered routes enforces it (AC-5).
- **Isolation** (ADR-003): every list and lookup is scoped to the session's teacher; a student id of another teacher is reported as 404 with the same body as a nonexistent id, so ids do not reveal existence. The database rejects a lesson linking a student of another teacher. Ids are sequential integers; isolation does not rely on them being unguessable.
- **User input**: student name; lesson student id, date, duration, price amount and currency; paging parameters. All validated at the boundary with the bounds in Behavior; JSON bodies only (CSRF rule, ADR-004); unknown body fields ignored and never stored.
- **Personal data**: student names (brief). They leave the system only in responses to their own teacher's session; never logged (request bodies, validation details, database errors). Seed names are synthetic.
- **Output**: names are rendered as text, never as HTML.
- **Abuse**: no per-teacher limit on students or lessons and no rate limiting in v1 (plan Risks); paging capped at 500 items per request.

## Non-functional
- Accessibility WCAG 2.1 AA: `/students` and `/lessons` in their default, empty, no-students and error states report 0 axe-core violations for wcag2a, wcag2aa and wcag21aa; all controls keyboard-operable with visible focus; field errors associated with their field; status and error messages announced via `role="status"` / `role="alert"`; payment status shown as text.
- No horizontal scrolling at 1280 px and 768 px wide.
- `GET /api/lessons?page_size=500` for a teacher with 500 lessons responds in under 500 ms at p95 on the local stack.
- Interface text in English (US).

## Out of scope
- Editing or deleting students or lessons (`questions.md` Q3).
- Student contact details or any field other than name (`questions.md` A6).
- Per-student default prices, recurring lessons, scheduling, calendar sync.
- Monthly totals, pending payments and marking lessons as paid (F03).
- Pagination in the UI (`questions.md` A10); lists beyond 500 items show only the truncation message.
- API endpoints that read a single student or lesson by id (none are needed; F03 adds lesson-by-id actions with the same 404 rule).
- Changing F01's login and sign-up failure message ("Something went wrong. Please try again.") to the F02 wording; would need its own change.
- Duplicate-name warnings and retry deduplication when a submit's response is lost on the network.
- Log out from pages other than `/`.

## Traceability
| Expected result | Criteria |
|---|---|
| Add a student by name; list sorted by name; empty state invites adding one | AC-1 |
| Record a lesson (student, date, duration, price in USD); invalid input shows a field error | AC-2, AC-3 |
| New lesson unpaid, listed newest first with student, date, duration, USD price, status | AC-2 |
| No students: explains a student is needed and links to adding one | AC-4 |
| Never sees or records for another teacher's students; API 404 for another teacher's student/lesson | AC-5 |
| `make seed`: one teacher with students and lessons across months, another with none | AC-6 |

## Open questions
None.

## Changelog
