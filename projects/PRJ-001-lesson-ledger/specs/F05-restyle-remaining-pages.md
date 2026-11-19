---
id: F05
project: PRJ-001
entry: projects/PRJ-001-lesson-ledger/plan/backlog/F05-restyle-remaining-pages.md
status: approved
version: 1
touches_frontend: true
adrs: [ADR-001, ADR-002, ADR-003, ADR-005]
---

# Restyle the remaining pages

## Summary
Home, students, lessons, monthly summary and pending payments are rebuilt from F04's shared components and theme, so every page follows `docs/design.md` and the frontend has one styling system. Nothing the pages do changes. Tables stay readable on phones (the student column stays in view while a table scrolls sideways), "Next month" no longer wraps below the month heading, and `docs/design.md` states the sizes the owner actually sees. The F04 multi-device checks now cover every page.

## Acceptance criteria
- **AC-1**: Given the repository after this feature, when `docs/design.md` is read and the production build is measured at 1280×800 on `/login`, then (a) the document states the root font size the app renders (18 px) and, for every type-scale step, spacing step, radius and width it lists, the px value as rendered at that root (for example `display` 54 px, `title` 40.5 px, `content` 1296 px, `form` 504 px), and states breakpoints as 640, 768 and 1024 px; (b) the rendered sizes are unchanged from the F04 merge: `h1` font size 54 px, label font size 18 px, text-field font size 20.25 px, `main` maximum width 1296 px, form width 504 px; (c) every visual pattern added for the F05 pages (at least: table, totals list, month navigation, payment status, pending total) is described in the document using only theme names; (d) the Screenshots section lists Home, Students, Lessons, Monthly summary and Pending payments at 375 and 1280 px, taken from this feature's build with seed teacher `alice@example.com`, and the files exist.
- **AC-2**: Given the frontend source, when it is inspected, then (a) no CSS module and no tokens file exist and none is imported; the only stylesheet is the shared styles file of F04; (b) no source file under `frontend/src` uses a `style` attribute or a literal color, pixel size or arbitrary value (`[...]`) in class names, and any custom CSS references only theme variables; (c) the home, students, lessons, summary and pending pages render buttons, fields, tables, status messages, alerts and load errors only through the shared components (the existing composition test is extended to these pages); (d) the design-doc parser used by the design and theme tests is no longer in the production source tree: it sits with the test support code, no non-test module imports it, and the tests that use it still pass.
- **AC-3**: Given seed teacher `alice@example.com`, when `/lessons`, `/summary` and `/pending` are shown, then (a) each table is the shared table component, keeps its current caption, column headers and column order, shows a double rule under the header row, and right-aligns Price with tabular figures; (b) the Status column of `/lessons` and `/summary` shows the text "Paid" or "Unpaid" in every row (any added color or shape is in addition to the text); (c) the summary totals remain a description list with terms "Lessons:", "Collected:", "Pending:", and `/pending` still shows "Total pending: … across n lessons"; (d) at 320 and 375 px wide, if a table's scroll region scrolls horizontally, then after scrolling it fully right, the Student cell of every row visible in the region lies fully inside the region's visible box and is the topmost element at its centre point (`document.elementFromPoint`); (e) at 1280 and 1920 px wide, a table may be as wide as `main` and no wider.
- **AC-4**: Given the change, when `make check` and `make e2e` run, then both pass, and the diff of every pre-existing unit and e2e test removes or weakens no assertion. Allowed edits to existing tests: selectors that depended on a CSS class name, and adding `wcag22aa` to the axe tags of the existing accessibility checks (so every page is checked against `wcag2a`, `wcag2aa`, `wcag21aa`, `wcag22aa`). Routes, visible text, labels, headings, captions, document titles, validation, error messages, focus behavior (heading on mount, first invalid field, re-focus after mark/undo), landmarks, live regions, error associations, and the mark-as-paid and undo flows of every page are unchanged.
- **AC-5**: Given the production build served at `APP_URL`, when `/login`, `/signup`, `/`, `/lessons`, `/students`, `/summary` and `/pending` are loaded (the last five as a logged-in teacher), then the `Content-Security-Policy` header is byte-identical to before this feature, no `securitypolicyviolation` event fires, no request fails, every font request goes to the `APP_URL` origin, and `document.fonts` reports each typeface in `docs/design.md` as `loaded`.
- **AC-6**: Given the production build, when every app page is checked in the states listed in Behavior ("Checked states"), then all of the following hold, checked on the whole page (not only the header). Each is an automated Playwright e2e check unless marked *inspection*. Terms as in F04 AC-6: *no horizontal page scroll* = document `scrollWidth` ≤ viewport width; *clipped* = a text element with `scrollWidth` > `clientWidth` or `scrollHeight` > `clientHeight` and computed `overflow` not `visible`; *overlap* = bounding boxes of two visible, non-nested interactive elements, labels, headings or messages intersecting by more than 1 CSS px (cells inside a table's scroll region are excluded; AC-3 d covers them).
  - (a) Accessibility: axe reports no violations for tags `wcag2a`, `wcag2aa`, `wcag21aa`, `wcag22aa`; every interactive element is at least 24×24 CSS px or meets the 2.5.8 spacing exception; when tabbing through each page, every focused element (including each table scroll region and each "Mark as paid" / "Mark as unpaid" button) has a visible focus indicator and no part of it is covered by a fixed or sticky element, including a sticky table cell; with `prefers-reduced-motion: reduce` emulated, no element has a computed `transition-duration` or `animation-duration` above `0.01ms`.
  - (b) Common widths: at 375, 768 and 1280 px wide, no page has horizontal page scroll, nothing is clipped or overlapping, and on `/summary` (F03 UI-1) "Previous month" and "Next month" have equal bounding-box tops (within 1 CSS px) and neither overlaps the month heading; at 768 and 1280 px all three share one row.
  - (c) Reflow (WCAG 1.4.10) at 320×568: no page has horizontal page scroll; every visible element lies horizontally within 0–320 px, except content inside a table's own scroll region; nothing is clipped or overlapping; "Previous month" and "Next month" still share one row.
  - (d) Wide screen at 1920×1080: `main` and the header's inner content are each no wider than the theme's `content` width; every body-text block (paragraphs, labels, hints, status and error messages, list items, totals) is at most 80ch wide, measured as rendered width ÷ width of the "0" glyph in its own font; tables are exempt from the 80ch limit (AC-3 e).
  - (e) Touch at 375×667 with `hasTouch`, `isMobile` and `hover: none` emulated: these flows pass using taps only: add a student, record a lesson, change month on `/summary`, mark a lesson paid and undo it on `/summary`, mark a lesson paid on `/pending`, log out from `/`; hovering each interactive element in turn makes no element or text visible that was not visible before. *Inspection*: every `hover:` style in the frontend has a `focus-visible:` (or `focus:`) style giving an equivalent cue on the same element, and no information is conveyed only by a `title` attribute.
  - (f) Text resize (WCAG 1.4.4) at 1280×800 with the root font size set by script after load (through the CSSOM, so the CSP is unchanged) to twice its computed value at load (36 px): no page has horizontal page scroll (tables may scroll inside their region); nothing is clipped or overlapping; every heading, label, field, button, link, message, caption and table header visible at 100% is still visible; submitting the empty "Add a student" form still shows its field error.
  - (g) Short landscape at 667×375: if the header or any table part is fixed or sticky vertically, it takes at most 25% of the viewport height (93.75 CSS px); when tabbing through each page, every focused element is fully inside the viewport and no part of it is covered by a fixed or sticky element; the flows of (e) pass using the keyboard only.

## Behavior
- **Root font size (F04 approver note 1)**: the owner approved F04 at the rendered sizes, so the root stays at 18 px and `docs/design.md` is corrected to the rendered px figures (AC-1). The theme's rem values do not change. Breakpoints in media queries resolve against the browser default (16 px), not the root, which is why they are stated as 640/768/1024 px.
- **Layout**: keep the approved look: one left-aligned column inside the `content` frame, ragged right, with the empty space to the right on desktop widths. Forms keep the `form` width and text the `measure`; only tables may widen to the full width of `main` (AC-3 e).
- **Narrow tables (F02 UX-3)**: tables keep scrolling inside their own focusable, labelled region (as F02); the Student column stays in view while the region scrolls (AC-3 d). Default chosen: no card or stacked-row layout on phones, so the `table` structure and column-position selectors of the e2e tests keep working.
- **Month navigation (F03 UI-1)**: fixed by layout only; button labels, heading text, order in the DOM and focus order ("Previous month", heading, "Next month") are unchanged. Default chosen: below 768 px the two buttons share a row and the heading may sit on its own row.
- **Payment status**: text stays the conveyor of state (AC-3 b). Any color or shape cue added must meet 4.5:1 text contrast or 3:1 UI-component contrast against its background, be a theme name, and be recorded in `docs/design.md`.
- **Accessibility target**: WCAG 2.2 AA for every page (owner decision; overrides the plan's and ADR-005's 2.1 AA). The existing axe checks move to the 2.2 tags (AC-4).
- **Checked states (AC-6)**: for every app page, the default state with `alice@example.com`; the empty state with `bob@example.com` (`/students`, `/lessons` "Add a student before recording a lesson.", `/summary` empty month, `/pending` "Nothing pending."); the many-items state with `carol@example.com` (`/lessons`, `/students`, `/summary`, `/pending` truncation messages); field errors on `/students` and `/lessons` (empty submit); the load-error state with "Try again" on `/students`, `/lessons`, `/summary` and `/pending` (API failure simulated in the test). Tab-through checks of (a) and (g) run on the default and error states only, not on carol's 500-row tables. These are the states the F02 and F03 specs already reach with `make seed`; no seed change is needed.
- **Test accounts**: flows that write data (AC-6 e, g) use teachers created by the test. Seed accounts are read-only in tests.
- **Copy**: no text changes, including the inconsistent network error copy (pilot finding 13).
- Additions to the visual identity are allowed only where the design plan has no rule for an F05 element; each is written to `docs/design.md` (AC-1 c). Palette, typefaces, type scale and layout concept of F04 do not change.

## Interfaces

### API
None.

### Data model
None.

### Configuration
None. CSP and security headers unchanged; no new runtime dependencies.

## UI
Design reference: `docs/design.md`. States are those of F01 (home), F02 and F03 specs, unchanged in content; only their look changes.

- **`/`**: default (email line, "Log out"); logging out (button disabled); "Couldn't log out. Please try again." alert.
- **`/students`**: loading; default (add form, list); empty; submitting; field errors; submit and load errors ("Try again"); success "Student added."; many items; no permission (redirect to `/login`).
- **`/lessons`**: loading; default (form, table); no students (message and link); empty; submitting; field errors; submit, 404 and load errors; success "Lesson recorded."; many items; no permission.
- **`/summary`**: loading; default (month navigation, totals, table); empty month; saving; success announcement; load and mark/undo errors; many items; no permission.
- **`/pending`**: loading; default (total, table); empty; saving; success (row removed, focus moved as F03); errors; many items; no permission.

## Security considerations
- No change to who can access what, no new user input, endpoints or data leaving the system.
- CSP stays `default-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'`; no external fonts, styles, scripts or images; no inline `style`.
- Moving the design-doc parser must not put test-only code into the production bundle.

## Non-functional
- Accessibility: WCAG 2.2 AA on every page (contrast 1.4.3/1.4.11, resize 1.4.4, reflow 1.4.10, focus visible 2.4.7, focus not obscured 2.4.11, target size 2.5.8, reduced motion).
- Responsive: AC-6 (a)–(g) on every page: 320 reflow, 375/768/1280, 1920 maximum width and 80ch lines, touch without hover-only cues, 200% text, 667×375 landscape.

## Out of scope
- Changing the F04 visual identity (palette, typefaces, scale, layout concept); only additions for F05 elements.
- Any behavior change, new pages, copy changes, new data, API or seed changes.
- Open non-blocking findings in `pilot-notes.md` other than F03 UI-1, F02 UX-3, F04 approver note 1 and F04 CODE-1 (for example F02 UX-1/UX-2, F03 UX-1, error copy alignment, the dev-dependency audit).
- A card or stacked-row table layout on phones; a collapsible navigation menu.
- Changing the root font size or the rendered size of anything approved in F04.

## Traceability
| Expected result | Criteria |
|---|---|
| Five pages follow `docs/design.md` and use F04's theme and shared components | AC-1 (c, d), AC-2 (b, c) |
| Data views easy to scan; payment status by text, not only color | AC-3 (a–c, e) |
| No CSS modules or tokens file; custom CSS only via the theme | AC-2 (a, b) |
| Every page works exactly as before | AC-4, AC-5 |
| WCAG AA (2.2 per owner), no horizontal scroll at 375/768/1280, wide tables scroll in their region without hiding the row | AC-3 (d), AC-4, AC-6 (a, b) |
| Owner: multi-device checks on every page | AC-6 (c–g) |
| Owner: F04 approver note 1 (root size vs `docs/design.md`) | AC-1 (a, b) |
| Owner: F03 UI-1 and F04 CODE-1 | AC-6 (b, c), AC-2 (d) |

## Open questions
None.

## Changelog
