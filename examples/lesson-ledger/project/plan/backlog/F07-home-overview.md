---
id: F07
project: PRJ-001
type: improvement
priority: high
milestone: v1
depends_on: [F06]
touches_frontend: true
adrs: [ADR-001, ADR-002, ADR-003, ADR-004, ADR-005, ADR-006]
---

## Problem
Home is the first page a teacher sees after logging in, yet it only shows the "Lesson Ledger" title and "Signed in as …". It has had no content of its own since F01, and F06 kept it that way because it changed only the look. The teacher has to open three other pages to know how the month is going, what is unpaid and what was recorded last, and a new teacher gets no hint of where to start. The owner rejected Home as too poor after F06 was merged (owner feedback, 2026-11-19; `pilot-notes.md` finding 17).

## Affected user
Teacher, right after logging in or when choosing Home in the sidebar, on phone, tablet or desktop; both a teacher with students and lessons and a new teacher with none. Project owner, who approves the new Home on screenshots before merge.

## Expected result
- Home shows the current month's collected, pending, lesson count and average per lesson, with the same definitions and figures as the Monthly summary panel of F06 for the same month.
- Home lists the 5 oldest unpaid lessons in the same order as Pending payments, each with the existing "Mark as paid" behaviour; marking one updates the list and the month figures without a reload, and a link leads to Pending payments.
- Home lists the 5 most recent lessons in the same order as Lessons, with their paid status, and a link leads to Lessons.
- The title row has "Record lesson" and "Add student" quick actions at the top right that take the teacher to the existing forms on Lessons and Students; "Signed in as …" stays if it fits the layout.
- A teacher with no students and no lessons sees short first-steps guidance pointing to Students and Lessons instead of empty figures and lists; partially empty states (students but no lessons, nothing pending) each show a short message.
- The page follows ADR-006 and meets WCAG 2.2 AA and the F04-F06 multi-device checks, and the owner approves it on screenshots before merge.

## Out of scope
- New forms, inline editing, or recording a lesson or adding a student from Home; the quick actions only navigate.
- Undo of "Mark as paid" on Home (it stays on Monthly summary only, as on Pending payments).
- New data, new metrics or charts beyond the four month figures (no trends, comparisons with previous months, per-student breakdowns).
- Month navigation on Home; it always shows the current month as defined for the Monthly summary (P3).
- Changes to any other page, the shell, the sidebar or the theme, apart from shared components Home needs that keep the other pages' look and behaviour.
- Fixing the open non-blocking findings in `pilot-notes.md`, unless a Home element is the cause.

## Constraints
- Use the existing API. The F02 and F03 read endpoints already provide the month totals, the oldest unpaid lessons, the latest lessons and the student and lesson counts needed for the empty states, with their existing paging. A backend change is allowed only if the spec shows a concrete gap, and then it must be the smallest change, keep teacher isolation (ADR-003, 404 across teachers) and default-deny authentication, and be justified in the spec.
- Month figures use the F03 totals definitions and the F06 average-per-lesson rule (plan R6), so Home and Monthly summary never disagree for the same month.
- "Mark as paid" on Home behaves as on Pending payments: the same request, in-flight state, error message, success announcement and focus handling after the row leaves the list.
- Quick actions are navigation links styled as ADR-006 page actions (primary solid black, secondary outlined); they must be distinguishable by accessible name and purpose from the form buttons with the same words on the target pages.
- Existing behaviour and tests of other pages are unchanged. The F01 test for "Signed in as {email}" and the shell's single "Log out" keep passing, unless the spec shows the line no longer fits and the test is updated with that reason.
- WCAG 2.2 AA (ADR-006): one `h1`, headings for each section, figures and lists with text labels, status never by colour alone, live region for mark-as-paid results, focus visible and not obscured, target size.
- Multi-device checks as in F06: no horizontal page scroll at 320, 375, 768 and 1280 px; content width limits at 1920 px; at 667x375 fixed or sticky regions never cover focused elements; at 200% text nothing is clipped or lost. Sections stack on narrow screens.
- Theme rules of ADR-005 and ADR-006: no literal colours, pixel sizes or arbitrary values in components.
- Merge gate (ADR-006, `pilot-notes.md` findings 15 and 17): the owner is shown Home at 375 and 1280 px with seed data and as a new teacher with no data, and is asked "Do you approve the look and content of Home?" as its own question. A rejection loops back into this feature.
- `make seed` must reach Home with data in the current month, unpaid lessons and recent lessons, and must keep a way to reach the new-teacher state (for example a freshly signed-up account), so the screenshots can show both.

## Context
- Owner feedback 2026-11-19 (revision request in `plan/README.md`, Revision 2026-11-19 b).
- ADR-006 (dashboard visual identity, approval gate), ADR-005 (theme rules), ADR-003 (data model, isolation), ADR-004 (session, log out in the shell).
- `specs/F03-monthly-summary-and-payments.md` (totals definitions, pending order, mark-as-paid behaviour and endpoints), `specs/F02-students-and-lessons.md` (lesson order, list endpoints, forms on Lessons and Students), `specs/F06-dashboard-redesign.md` (metrics panel, average per lesson, page actions style, multi-device checks), `specs/F01-teacher-accounts.md` (Home and "Signed in as").
- `pilot-notes.md` findings 15 (visual gate) and 17 (pages without purpose or content).
