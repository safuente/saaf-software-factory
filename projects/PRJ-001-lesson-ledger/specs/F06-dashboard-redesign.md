---
id: F06
project: PRJ-001
entry: projects/PRJ-001-lesson-ledger/plan/backlog/F06-dashboard-redesign.md
status: approved
version: 1
touches_frontend: true
adrs: [ADR-001, ADR-002, ADR-003, ADR-004, ADR-005, ADR-006]
---

# Dashboard redesign of every page and the app shell

## Summary
The manuscript identity of F04/F05 is replaced by the owner's dashboard direction (ADR-006, `context/design-direction.md`, `context/design-reference.png`). App pages sit in a dark sidebar shell with Home, Lessons, Students, Monthly summary, Pending payments and log out. The main area is white, with a large sans-serif title. Tables are dense, with student initials and worded payment status. The Monthly summary gains a month chip and a metrics panel built from data it already loads. Login and sign-up follow the same look without the sidebar. Nothing the app does changes. The owner approves the look on screenshots before merge.

## Acceptance criteria
- **AC-1**: Given the repository after this feature, when it is inspected and the production build is measured at 1280×800, then:
  - (a) `docs/design.md` describes the dashboard direction: palette, one sans-serif family, type scale, layout (sidebar shell, top bar below 1024 px, title row), buttons, tables, initials, payment status, month chip and metrics panel. It also lists the reference elements adopted and left out (ADR-006), each with how it meets WCAG 2.2 AA.
  - (b) The document states the root font size the app renders. For `h1`, body text, label, text field, button, table cell and sidebar link, the px font size it states equals the computed font size on `/login`, `/` and `/lessons`.
  - (c) The source tree, the theme, `docs/design.md` and the build output contain no stave, note heads, piano-key buttons, the pinned column's bar line, the F04 palette names or the Alegreya families. Every font file in the frontend is referenced by the theme.
  - (d) The "Screenshots" section of `docs/design.md` lists `/login`, `/signup`, `/`, `/lessons`, `/students`, `/summary` and `/pending` at 375 and 1280 px, 14 files in total. The files exist and were taken from this feature's production build. App pages use seed teacher `alice@example.com` and the current month.
- **AC-2**: Given the production build and a logged-in teacher, when any app page (`/`, `/lessons`, `/students`, `/summary`, `/pending`) is shown, then:
  - (a) At viewport widths ≥ 1024 px, a dark sidebar is to the left of `main`. It is at least as tall as the viewport and contains the "Main" `nav` with links Home, Lessons, Students, Monthly summary, Pending payments in that order, plus a "Log out" button below the links, at the bottom of the sidebar.
  - (b) At widths < 1024 px, the same `nav` and "Log out" form a full-width dark bar above `main`. The links wrap onto as many rows as needed. There is no menu toggle and no horizontal scroll inside the bar.
  - (c) At no width are the sidebar or bar fixed or sticky.
  - (d) The current page's link keeps `aria-current="page"`. It differs from the other links in at least one computed property other than colour (font weight, text decoration, border width or a visible indicator shape).
  - (e) `main` has a white background and an `h1` in the theme's sans-serif family at the type scale's largest title step.
  - (f) Activating "Log out" on any app page sends `DELETE` to the session endpoint as F01 does and lands on `/login`. While the request runs, the button is disabled. On failure, "Couldn't log out. Please try again." appears in a `role="alert"` region at the top of `main`. `/` still shows "Signed in as {email}" and no second "Log out" control.
  - (g) `/login` and `/signup` show no sidebar or bar, a white page, the same title style and the primary button.
  - (h) Primary buttons have a black fill with white text. Secondary buttons have a white or transparent fill, a visible outline and dark text.
- **AC-3**: Given seed teacher `alice@example.com`, when `/lessons`, `/summary` and `/pending` are shown, then:
  - (a) Each table keeps its caption, column headers and column order from F02/F03. Header cells have a grey background or grey text distinct from body cells. A 1 CSS px divider separates rows. No double rule or bar line remains.
  - (b) Each Student cell shows, before the name, a circle containing the student's initials, for example "ZP" for "Zoe Park". The initials are hidden from assistive technology. The cell's accessible text is exactly the student's name, and no new column is added.
  - (c) On `/lessons` and `/summary`, every Status cell shows "✓ Paid" with green text or "Unpaid" with amber text. Both meet 4.5:1 contrast against the cell background. The accessible text of the cell is exactly "Paid" or "Unpaid".
  - (d) `/students` uses the same list or table style: grey headers or labels, thin dividers, and an initials circle next to each name.
  - (e) The F05 AC-3 (d) and (e) checks still pass: the Student cell stays visible while a table scrolls at 320/375 px, and a table is no wider than `main` at 1280/1920 px.
- **AC-4**: Given a logged-in teacher with the data of F03 AC-1 (November 2026: collected 4250 cents, pending 6000 cents, 3 lessons), when `/summary?month=2026-11` is shown at 1280×800, then:
  - (a) The month controls appear as a chip group: "Previous month", the `h2` "November 2026" in a rounded outlined chip, and "Next month". DOM order, focus order, accessible names, disabling at 2000-01 / 2099-12, and URL behaviour are as F03.
  - (b) A metrics panel to the right of the table contains:
    - the totals description list with exactly the terms "Lessons:", "Collected:", "Pending:" and values "3", "$42.50", "$60.00", in that order;
    - a paid versus pending bar, hidden from assistive technology, whose paid segment is 41% of its width (±1 percentage point);
    - the visible text "41% paid · 59% pending";
    - the text "Average per lesson: $34.17".
  - (c) After "Mark as paid" on lesson B (6000 cents), without reload, the panel reads "Collected: $102.50", "Pending: $0.00" and "100% paid · 0% pending". The average is unchanged at $34.17. The F03 announcement is unchanged.
  - (d) For `/summary?month=2026-08` (no lessons), the panel shows "Lessons:" 0, "$0.00", "$0.00", an empty bar, "No amounts this month." in place of the percentage text, and "Average per lesson: —". "No lessons in August 2026." still replaces the table.
  - (e) At widths < 1280 px, the panel appears between the month chip and the table, full width of `main`, in the same DOM position as at 1280 px.
  - (f) While loading, or on load error, the panel is not shown, and the F03 "Loading…" and "Try again" states are unchanged.
  - (g) No request is made that F03's `/summary` did not make.
- **AC-5**: Given the change, when `make check` and `make e2e` run, then:
  - (a) Both pass.
  - (b) The diff of pre-existing unit and e2e tests removes or weakens no behaviour assertion. Only two kinds of change are allowed: selectors tied to CSS classes, and tests that assert the manuscript identity itself (old design-plan contents, old theme names and values, stave, bar line, double rule), which are replaced by tests of AC-1 to AC-4.
  - (c) Routes, visible text other than the additions in AC-3 (c) and AC-4 (b, d), labels, headings, captions, document titles, validation, error messages, focus behaviour, landmarks (one `main`, one "Main" `nav`), live regions, error associations, API calls, and the mark-as-paid and undo flows are unchanged.
  - (d) On the production build, `/login`, `/signup` and the five app pages return a `Content-Security-Policy` header byte-identical to F05's. No `securitypolicyviolation` event fires. Every font request goes to the `APP_URL` origin, and `document.fonts` reports the `docs/design.md` family as `loaded`.
- **AC-6**: Given the production build, when the F05 AC-6 checks (a) to (g) run with the same definitions, they pass on all seven pages. App pages are checked in the states of F05 Behavior "Checked states". `/login` and `/signup` are checked in their default, field-error and form-error states. In addition:
  - (a) On the dark bar and sidebar, link and button text have ≥ 4.5:1 contrast. The focus indicator has ≥ 3:1 contrast against the dark ground and against white in `main`.
  - (b) At 320×568, at 667×375, and at 1280×800 with 200% root text, every navigation link and "Log out" can be reached by Tab and activated by tap. Each lies horizontally within the viewport and is not clipped.
  - (c) At 1920×1080, `main`'s content is no wider than the theme's `content` width.
  - (d) At 375, 768 and 1280 px, the panel of AC-4 and the month chip cause no horizontal page scroll, clipping or overlap.

## Behavior
- **Defaults chosen** (the owner pre-authorised these; listed for review):
  - **Home is included** (plan R5). Its `h1` "Lesson Ledger" and "Signed in as …" line stay.
  - **Log out moves into the shell.** It appears on every app page at the bottom of the sidebar or at the end of the top bar, and Home's own button is removed so there is one "Log out" per page. The request, navigation, disabled state and failure alert are F01's.
  - **Narrow-screen navigation.** Below 1024 px the sidebar becomes a non-sticky dark top bar with wrapping links, with no toggle and no scrolling. Above 1024 px the sidebar is a non-sticky column. Nothing is fixed or sticky, so nothing can cover focus at 667×375 or 200% text, and every link stays visible without new controls.
  - **Average per lesson** = (collected + pending) ÷ month lesson count, in cents, rounded half up to the cent and formatted like other amounts. It shows "—" when the count is 0. Lessons priced $0 count.
  - **Bar percentages.** paid % = round(collected ÷ (collected + pending) × 100), and pending % = 100 − paid %. When collected + pending = 0, the bar is empty and the text is "No amounts this month." The bar updates with the totals after mark/undo.
  - **Month chip** restyles the existing Previous/Next buttons and the month heading only. Visible labels stay "Previous month" / "Next month" (no copy change), and there is no picker (plan R7). The F05 layout rules for these controls (equal tops; one row at ≥ 768 px; buttons sharing a row at 320/375 px) still apply.
  - **Panel position.** The panel sits on the right at ≥ 1280 px and stacks above the table below that. It sits above the table because its DOM position is before the table, as the totals are today.
  - **Unpaid colour is amber**, not red, so it is not confused with error alerts. Paid is green with a decorative "✓".
  - **Top-right actions.** No existing page has a page-level action outside its forms, so no control moves into the title row. Form submits ("Add student", "Record lesson", "Log in", "Create account") use the primary style, and the other buttons use the secondary style. Mark as paid / Undo paid stay secondary row buttons.
  - **Root font size** is the Builder's choice. `docs/design.md` must state the rendered values (AC-1 b), so the F04 mismatch does not recur.
- **Initials**: the first character of the first word plus the first character of the last word of the trimmed name, uppercased. A one-word name gives one character. Names are synthetic (brief), so nothing new is exposed.
- **Fonts**: one self-hosted sans-serif family under a licence allowing redistribution (e.g. OFL), with at most 3 weights or one variable file. The Alegreya files are deleted.
- **Theme rules** (ADR-005, conventions §1): every colour, size and radius is a theme name. There are no literal values, arbitrary values or `style` attributes in components, and every `hover:` cue has a `focus-visible:` twin.
- **Seed**: no change. The states of AC-4 use test-created teachers with the F03 AC-1 data, and the screenshots use alice.
- **Merge gate** (ADR-006, pilot finding 15): outside the Approver's check. The orchestrator shows the owner the 14 screenshots of AC-1 (d) and asks "Do you approve the look?" as a separate question. A rejection loops back into F06.

## Interfaces

### API
None.

### Data model
None.

### Configuration
None. The CSP and security headers are unchanged, and there are no new runtime dependencies other than the font files.

## UI
Design reference: `docs/design.md` (rewritten) and `context/design-reference.png`. The states of every page are those of F01, F02 and F03, as listed in F05 UI. Only their look changes, except for the following:
- **Shell (app pages)**: sidebar (≥ 1024 px) or top bar (< 1024 px). Normal state; logging out (button disabled); log-out error alert at the top of `main`.
- **`/`**: default shows the `h1` and "Signed in as {email}". The log-out states are in the shell.
- **`/summary`**:
  - Loading: the chip is shown, and "Loading…" replaces the panel and table.
  - Default: chip, panel, table.
  - Empty month: AC-4 (d).
  - Saving: as F03.
  - Success: panel figures update in place.
  - Load error: "Try again", no panel.
  - Mark/undo error: alert, panel unchanged.
  - Many items: as F03.
  - No permission: redirect to `/login`.
- **`/login`, `/signup`**: default, submitting, field errors, form error. No sidebar.

## Security considerations
- There is no change to who can access what, and there are no new endpoints, inputs or data leaving the system. The panel and initials derive from data the page already holds for its own teacher.
- Log out now appears on every app page but uses the same request and session handling (ADR-004). After log out, cached data is cleared as in F01.
- The CSP stays `default-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'`. There are no external fonts, styles, scripts or images and no inline styles. The bar's width must not need an inline `style` attribute.

## Non-functional
- Accessibility: WCAG 2.2 AA on all seven pages. This covers contrast 1.4.3/1.4.11 (including on the dark ground), resize 1.4.4, reflow 1.4.10, focus visible 2.4.7, focus not obscured 2.4.11, target size 2.5.8 and reduced motion. Status and bar never rely on colour alone.
- Responsive: AC-6 at 320, 375, 768, 1280 and 1920 px, at 667×375, and at 200% text.

## Out of scope
- Search, extra filters, row checkboxes and bulk actions, row detail popover, import and export, notifications, and navigation items for non-existent pages (Inventory, Help, Settings).
- Any behaviour change (routes, copy, validation, error handling, API calls, session handling, mark/undo, month navigation), a month picker, and a menu toggle or drawer for navigation.
- New data, API or seed changes, and a Status column on `/pending`.
- Dark mode, theme switching, a logo or illustrations.
- Changing the CSS framework or ADR-005's theme rules.
- Open `pilot-notes.md` findings unless a redesigned element causes them.

## Traceability
| Expected result | Criteria |
|---|---|
| Design plan and theme implement ADR-006, sizes match rendering, no manuscript identity left | AC-1 (a–c), AC-5 (b, d) |
| Dark sidebar shell, current-page cue, log out, title, primary/secondary buttons; auth pages without sidebar | AC-2, AC-6 (a, b) |
| Dense tables, initials, worded status; students page in the same style | AC-3 |
| Month chip and metrics panel from existing data, stacking on narrow screens | AC-4, AC-6 (d) |
| Every page works as before; WCAG 2.2 AA; multi-device checks | AC-5, AC-6 |
| Owner approves screenshots of every page at 375 and 1280 before merge | AC-1 (d); merge gate in Behavior |

## Open questions
None.

## Changelog
