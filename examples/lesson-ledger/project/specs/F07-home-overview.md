---
id: F07
project: PRJ-001
entry: projects/PRJ-001-lesson-ledger/plan/backlog/F07-home-overview.md
status: approved
version: 1
touches_frontend: true
adrs: [ADR-001, ADR-002, ADR-003, ADR-004, ADR-005, ADR-006]
---

# Home overview

## Summary
Home becomes the teacher's overview. It shows the current month's four figures, matching the Monthly summary. It lists the 5 oldest unpaid lessons, each with the existing "Mark as paid", and the 5 latest lessons, each with a link to its full page. Two quick-action links in the title row lead to the Lessons and Students forms. A new teacher sees first-steps guidance instead of empty figures and lists. All data comes from the existing F02/F03 endpoints. There is no backend change.

## Acceptance criteria
- **AC-1** (month figures): Given seed teacher `alice@example.com` (seed of the same day), when `/` is shown, then:
  - (a) Under the `h2` "{Month YYYY}" of the browser's current month, a description list shows these terms and values, in this order: "Collected" $45.00, "Pending" $136.25, "Lessons" 4, "Average per lesson" $45.31.
  - (b) Each value equals the corresponding value on `/summary` (no `month` parameter) in the same session: the totals list and the "Average per lesson:" text of the F06 panel. The check runs as one e2e test that reads both pages.
  - (c) For seed teacher `carol@example.com`, the values are $0.00, $23,400.00, 520 and $45.00, and they equal carol's `/summary` values the same way.
  - (d) For a teacher with lessons but none in the current month, the values are $0.00, $0.00, 0 and "—", and "No lessons in {Month YYYY}." is shown under the list.
- **AC-2** (lists): Given `alice@example.com`, when `/` is shown, then:
  - (a) Section `h2` "Oldest unpaid lessons" shows "Total pending: $363.00 across 9 lessons". Below it is a table captioned "Oldest unpaid lessons, oldest first", with columns Student, Date, Duration, Price, Action. Its 5 rows equal, in order, the first 5 rows of `/pending` (student and date). They are Chloé Dubois, Dev Patel, Emma Rossi, Finn Walsh and Ava Martin. A link "View all pending payments" leads to `/pending`.
  - (b) Section `h2` "Latest lessons" shows a table captioned "Latest lessons, newest first", with columns Student, Date, Duration, Price, Status. Its 5 rows equal, in order, the first 5 rows of `/lessons` (student, date, status). Status reads "Paid" or "Unpaid", styled as on `/lessons`. A link "View all lessons" leads to `/lessons`.
  - (c) "Signed in as alice@example.com" is visible.
  - (d) For `carol@example.com`, each table has exactly 5 rows, the total reads "Total pending: $23,400.00 across 520 lessons", and no truncation message is shown.
  - (e) Loading `/` makes exactly these API reads, besides the session check: `GET /api/monthly-summaries/{YYYY-MM}` for the browser's current month, `GET /api/pending-lessons?page=1&page_size=5`, `GET /api/lessons?page=1&page_size=5` and `GET /api/students?page=1&page_size=1`. No other endpoint is called and no endpoint is added or changed. `backend/openapi.json` is unchanged.
- **AC-3** (mark as paid, reusing F03 AC-3 and AC-6):
  - (a) Given a test-created teacher with the F03 AC-2 data (4 unpaid lessons, 1 paid) and a browser date of 2026-11-18, when the teacher is on `/`, then the "Oldest unpaid lessons" table shows those 4 lessons in the F03 AC-2 order. Month figures for November 2026 are shown.
  - (b) The F03 AC-3 `/pending` check passes on Home's table unchanged in every respect, with one exception. "Mark as paid" on the `2026-10-10` 4500-cent lesson sends `PATCH /api/lessons/{id}` `{"paid": true}`. Without a reload, the row leaves the table and the total reads "Total pending: $1,326.25 across 3 lessons". The `role="status"` region announces "Marked {student}'s lesson on Oct 10, 2026 as paid. Total pending: $1,326.25.". Focus moves to the next row's "Mark as paid" button, or to the previous row's button if the marked row was last. The exception: when the table becomes empty, focus goes to the `h2` "Oldest unpaid lessons", not the `h1`.
  - (c) The month figures are unchanged after (b), because that lesson is in October. "Mark as paid" on the `2026-11-03` 4250-cent lesson changes them without reload to Collected +$42.50 and Pending −$42.50. If that lesson is in "Latest lessons", its Status becomes "Paid". `/summary` then shows the same Collected and Pending as Home.
  - (d) While the request runs, the button is disabled and reads "Saving…". The F03 AC-6 mark-as-paid failure checks pass on Home: on a 5xx or network failure, "We couldn't reach Lesson Ledger. Please try again." appears in a `role="alert"` region. On a 404, "That lesson could not be found. Reload the page and try again." appears instead. In both cases the row, figures and total are unchanged, and focus is on the same re-enabled button. Home offers no "Undo paid".
- **AC-4** (quick actions): Given any logged-in teacher on `/`, then:
  - (a) The title row contains, to the right of the `h1` at ≥ 1024 px, two links. Their visible text is "Record lesson" (primary style: black fill, white text) and "Add student" (secondary style: outlined).
  - (b) Their accessible names are "Record lesson on the Lessons page" and "Add student on the Students page". Each name starts with its visible text (WCAG 2.5.3).
  - (c) Each has role `link`, not `button`. Tests locate them only by role and name.
  - (d) Activating them navigates to `/lessons` and `/students` respectively, without a full reload.
  - (e) On those pages, `getByRole("button", { name: "Record lesson" })` and `getByRole("button", { name: "Add student" })` each still match exactly one element, the form's submit button.
- **AC-5** (empty, partial and error states):
  - (a) Given seed teacher `bob@example.com` (0 students, 0 lessons), when `/` is shown, then in place of the figures and both lists there is an `h2` "Get started" with an ordered list of two steps:
    1. "Add your students." with the link "Add your first student" to `/students`.
    2. "Record each lesson; Home then shows how the month is going and what is unpaid." with the link "Record your first lesson" to `/lessons`.
    The quick actions and "Signed in as bob@example.com" are still shown. No figures, tables, "$0.00" or "—" appear.
  - (b) Given a test-created teacher with 1 student and 0 lessons, the figures show $0.00, $0.00, 0 and "—", together with "No lessons in {Month YYYY}.". "Oldest unpaid lessons" shows "Nothing pending." and "Latest lessons" shows "No lessons recorded yet.". There is no "Get started".
  - (c) Given a test-created teacher whose lessons are all paid, "Oldest unpaid lessons" shows "Nothing pending. Every lesson is paid." and no table, while the figures and "Latest lessons" are shown.
  - (d) Given `alice@example.com` and any of the four reads of AC-1 (e) failing with a 5xx or network error (simulated in the test), the area below the title row shows only "We couldn't reach Lesson Ledger." and a "Try again" button. The `h1`, "Signed in as …" and the quick actions stay. "Try again" repeats the loads, and on success the default state of AC-1 and AC-2 appears.
  - (e) While loading, a single "Loading…" in a `role="status"` region replaces the figures and lists. "Get started" is never shown before the loads complete.
  - (f) Without a session, `/` redirects to `/login` as before.
- **AC-6** (accessibility, devices, regressions, gate): Given the production build, when the checks run on `/` in the states of Behavior "Seed accounts and states", then:
  - (a) The F05 AC-6 (a)–(g) checks and the F06 AC-6 (a)–(d) checks pass on `/`, with their definitions. The touch flow (e) and keyboard flow (g) include "Mark as paid" on Home and both quick actions, using a test-created teacher.
  - (b) `/` has one `h1` and the `h2`s named above. Status is never conveyed by colour alone.
  - (c) Below 1024 px, sections stack in DOM order: title row, figures, "Oldest unpaid lessons", "Latest lessons". At 320 px the title row's links wrap below the `h1` without overlap or horizontal page scroll. The Home tables follow F05 AC-3 (d) and (e).
  - (d) `make check` and `make e2e` pass. Pre-existing tests of other pages and of the shell are unchanged, except selectors tied to CSS classes. Every pre-existing "Signed in as {email}" assertion passes unmodified, and every app page still has exactly one "Log out".
  - (e) The `Content-Security-Policy` header of `/` is byte-identical to F06's, and no `securitypolicyviolation` event fires.
  - (f) `docs/design.md` describes Home's sections and the page-action link style using theme names only. Its "Screenshots" section lists `/` at 375 and 1280 px for `alice@example.com` and for `bob@example.com`, 4 files taken from this feature's production build. The files exist.

## Behavior
- **Defaults chosen** (owner pre-authorised defaults; listed for review):
  - **No backend change.** R9 holds. The month figures come from the monthly summary. The oldest unpaid lessons and the all-months total come from the pending list, which is already in oldest-first order. The latest lessons come from the lessons list, which is already newest first. The new-teacher test uses `total` of the lessons and students lists.
  - **Figures** use the F03 totals definitions and the F06 average rule: (collected + pending) ÷ lesson count, rounded half up to the cent, or "—" when the count is 0. The "current month" is the browser's local month (P3, R10). There is no month navigation and no paid/pending bar, because the entry asks for four figures only.
  - **Pending total line.** The "Oldest unpaid lessons" section shows the F03 line "Total pending: {amount} across {n} lessons" over all months. The F03 success announcement Home must reuse cites this amount, and the line also tells the teacher how many unpaid lessons the 5 rows stand for. This is existing `/pending` content, not a new metric.
  - **Focus when the Home table empties** goes to the section `h2`, made programmatically focusable, instead of the `h1`. The section heading is next to where the rows were, and the `h1` is at the top of the page. All other mark-as-paid behaviour is F03's.
  - **Refill.** After a successful mark, the table refills from the server up to 5 rows. The 6th oldest appears at the end, and focus stays as in AC-3 (b).
  - **Quick actions** are plain links styled as ADR-006 page actions. "Record lesson" is the primary action and "Add student" the secondary. Their accessible names add the destination page (AC-4 b), so they differ from the submit buttons on the target pages and from the sidebar links. With no students, "Record lesson" still leads to `/lessons`, which shows F02's "Add a student before recording a lesson." (R11). The primary style on a link extends F06's rule that only form submits are primary. `docs/design.md` records this.
  - **New-teacher state** applies when students `total` = 0 and lessons `total` = 0 (R13). Lessons cannot exist without students, because there are no deletes. The first-steps links have names distinct from the sidebar's "Students" and "Lessons".
  - **Empty messages.** "Nothing pending." when the teacher has no lessons at all. "Nothing pending. Every lesson is paid." (F03 text) when lessons exist and all are paid. "No lessons recorded yet." (F02 text) when there are no lessons. "No lessons in {Month YYYY}." (F03 text) when the current month has none.
  - **One load state for the page.** Home shows "Loading…" until all four reads finish. If any read fails, one load error replaces all data sections (as F03's `/summary`), so the page never shows the guidance or half the figures by mistake.
  - **`h1` stays "Lesson Ledger"** and the document title is unchanged. "Signed in as {email}" stays in the title row under the `h1`. It fits at every checked width, and around 14 F01–F06 tests use it as the logged-in signal.
- **Seed accounts and states** (pilot finding 8; no seed change needed). Each Home state is reached as follows:
  - **Default (seed data):** `alice@example.com`. Current month: 4 lessons, 1 paid. 9 unpaid lessons across three months; 12 lessons in total.
  - **Many items:** `carol@example.com`. 520 unpaid lessons in the current month, 510 students.
  - **New teacher:** `bob@example.com`. 0 students and 0 lessons. A freshly signed-up account reaches the same state.
  - **Students, no lessons:** a test-created teacher with 1 student. For screenshots or review: bob after adding one student, then re-run `make seed`.
  - **All paid:** a test-created teacher, or a month with no lessons via test-created data.
  - **Mark-as-paid flows:** a test-created teacher with the F03 AC-2 data.
  - **Load error:** `alice@example.com` with the API failure simulated in the test (route interception).
  - Seed accounts stay read-only in tests (F05 Behavior).
- **Seed and browser month.** alice's and carol's current-month data uses the server date at seed time, and Home uses the browser month. Both are the same machine, but a seed run before midnight at a month's end gives a different month. AC-1 values assume `make seed` ran the same day.
- **Theme rules** (ADR-005, ADR-006): theme names only. No literal colours, pixel sizes, arbitrary values or `style` attributes. Every `hover:` cue has a `focus-visible:` twin.
- **Merge gate** (ADR-006, pilot findings 15 and 17) is outside the Approver's check. The orchestrator shows the owner the 4 screenshots of AC-6 (f) and asks "Do you approve the look and content of Home?" as its own question. A rejection loops back into F07.

## Interfaces

### API
None changed. Home reads `GET /api/monthly-summaries/{month}`, `GET /api/pending-lessons`, `GET /api/lessons` and `GET /api/students` with the paging of AC-1 (e). It writes with `PATCH /api/lessons/{id}` `{"paid": true}`. All behave as specified in F02 and F03, including 401 and 404 rules.

### Data model
None.

### Configuration
None. No new runtime dependencies.

## UI
Design reference: `docs/design.md`, ADR-006. Only `/` changes.
- **Loading:** title row (`h1`, "Signed in as", quick actions) is shown, and "Loading…" (`role="status"`) is shown below it.
- **Default:** title row, the figures (AC-1), "Oldest unpaid lessons" (AC-2 a) and "Latest lessons" (AC-2 b).
- **Many items:** 5 rows per table and the full total line (AC-2 d).
- **Empty (new teacher):** title row and "Get started" (AC-5 a).
- **Partially empty:** messages of AC-5 (b, c) and AC-1 (d).
- **Saving:** the row's button disabled, reading "Saving…".
- **Success:** the row leaves the table, the total, figures and status update, the announcement plays and focus moves (AC-3).
- **Error:** load error with "Try again" (AC-5 d); mark-as-paid alerts (AC-3 d).
- **No permission:** redirect to `/login`.

## Security considerations
- There are no new endpoints, inputs or stored data. Home uses session-scoped reads and the existing PATCH. Isolation (ADR-003, 404 across teachers) and default-deny authentication are unchanged and covered by F02 AC-5 and F03 AC-5.
- Data shown is the session teacher's own figures, student names and lessons. Student names render as text, never HTML, and are never logged.
- The only user input is the mark-as-paid action, which sends the existing `{"paid": true}` body.
- CSP is unchanged. There are no external resources and no inline styles.

## Non-functional
- WCAG 2.2 AA on `/` in every state of Behavior "Seed accounts and states". This includes contrast, reflow at 320 px, 200% text, focus visible and not obscured, target size, reduced motion and the live region for mark-as-paid.
- Responsive per AC-6: 320, 375, 768, 1280 and 1920 px, 667×375, and 200% text.
- Interface text in English (US). Formats as F02/F03.

## Out of scope
- Forms, inline editing, or recording a lesson or adding a student from Home. The quick actions only navigate.
- Undo of "Mark as paid" on Home.
- New data, metrics or charts beyond the four figures. This excludes the paid/pending bar, trends, comparisons and per-student breakdowns.
- Month navigation on Home.
- Changes to other pages, the shell, the sidebar or the theme, apart from shared components that keep other pages' look and behaviour. A link to Monthly summary from Home is also excluded, because the sidebar already has one.
- Backend, API, OpenAPI or seed changes.
- Open `pilot-notes.md` findings unless a Home element causes them.

## Traceability
| Expected result | Criteria |
|---|---|
| Current month's collected, pending, lesson count, average; same figures as Monthly summary | AC-1, AC-3 (c) |
| 5 oldest unpaid with "Mark as paid", updates list and figures without reload, link to Pending payments | AC-2 (a, d, e), AC-3 |
| 5 latest lessons with paid status, link to Lessons | AC-2 (b, d) |
| "Record lesson" and "Add student" quick actions to the existing forms; "Signed in as" stays | AC-4, AC-2 (c), AC-6 (d) |
| New-teacher guidance; partially empty states with short messages | AC-5 (a–c), AC-1 (d) |
| ADR-006, WCAG 2.2 AA, multi-device checks, owner approval on screenshots | AC-6; merge gate in Behavior |

## Open questions
None.

## Changelog
