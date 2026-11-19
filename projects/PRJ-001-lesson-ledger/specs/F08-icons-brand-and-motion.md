---
id: F08
project: PRJ-001
entry: projects/PRJ-001-lesson-ledger/plan/backlog/F08-icons-brand-and-motion.md
status: approved
version: 1
touches_frontend: true
adrs: [ADR-001, ADR-002, ADR-005, ADR-006, ADR-007]
---

# Icons, brand and motion

## Summary
Sidebar links, the listed action buttons and alerts gain decorative Lucide icons next to their unchanged text. An original logo mark with the "Lesson Ledger" wordmark tops the sidebar and the narrow-screen top bar, and the tab shows a matching favicon. Home's "Get started" box and the four list empty states gain a small original illustration. Hover/focus feedback, the paid/pending bar, the metric figures and a just-paid row on Monthly summary get subtle motion, all off under reduced motion. Nothing the app does changes.

## Acceptance criteria
- **AC-1** (icons): Given the production build and seed teacher `alice@example.com` (states needing data changes use a test-created teacher), then:
  - (a) Each of these shows exactly one icon immediately before its visible text, with the glyph of Behavior "Icon map": the 5 sidebar links; "Record lesson" (Lessons submit and Home quick action); "Add student" (Students submit and Home quick action); every "Mark as paid" (`/summary`, `/pending`, `/`); every "Undo paid" (`/summary`); "Log out"; every `role="alert"` message drawn by the shared alert (form errors, mark/undo errors, load errors, log-out error).
  - (b) No other element shows an icon: no icon in table cells, payment status, form fields, the month chip, "Try again", text links, headings or `role="status"` regions.
  - (c) Every icon `svg` has `aria-hidden="true"`, no `title`/`desc` child, no `tabindex`, and is not focusable. Each control of (a) matches `getByRole(<role>, { name: <pre-F08 name>, exact: true })` with the same role and name as before F08, including Home's "Record lesson on the Lessons page" and "Add student on the Students page". Each alert's text content is exactly its pre-F08 text.
  - (d) While a button reads "Saving…" (or any text other than its label in (a)), it shows no icon; when its label returns, the icon returns.
  - (e) Icons take the text colour of their control and keep ≥ 3:1 contrast against its background (WCAG 1.4.11), in the normal, hover, focus and disabled states.
  - (f) The current sidebar link keeps the F06 AC-2 (d) non-colour cue; the icon is identical on current and other links apart from colour.
- **AC-2** (brand): Given the production build, then:
  - (a) On every app page at ≥ 1024 px, the sidebar's first content, above the "Main" `nav`, is the logo mark followed by the visible text "Lesson Ledger". Below 1024 px the same pair is the first content of the top bar, before the links. The mark `svg` has `aria-hidden="true"`; the wordmark is plain text, not a heading, link or button, and the page keeps one `h1`, one `main`, one "Main" `nav` and the same Tab order.
  - (b) `/login` and `/signup` are unchanged: no logo, no wordmark (R17: they show no visible product name today).
  - (c) `index.html` has `<link rel="icon" type="image/svg+xml" href="/favicon.svg">`. `GET {APP_URL}/favicon.svg` returns 200 with `Content-Type: image/svg+xml` and the same security headers as `/`. The file and the inline logo contain no `style` attribute, no `<style>` or `<script>` element, no `data:` URI and no reference to another origin.
  - (d) The favicon draws the same mark as the logo, with colours equal to theme token values (listed in `docs/design.md`).
- **AC-3** (illustrations): Given each state of Behavior "Illustrated states", reached with the named account, then:
  - (a) Exactly one inline `svg` illustration appears in that state, directly above the message text, outside any table, with `aria-hidden="true"`, no `title`/`desc`, and fills/strokes from theme names only.
  - (b) The message text, its element, its heading and its links are exactly as before F08; the F02/F03/F07 tests that assert them pass unmodified.
  - (c) No illustration appears in any other state: not on Home's in-section messages ("No lessons in {Month YYYY}.", "Nothing pending.", "Nothing pending. Every lesson is paid.", "No lessons recorded yet." under Home's sections), not on "Add a student before recording a lesson.", not on loading or error states.
- **AC-4** (motion, no preference): Given `prefers-reduced-motion: no-preference` and a 1280×800 viewport, then, measured on computed styles:
  - (a) Sidebar links, buttons (all variants), Home's quick-action links and text links have `transition-duration` between 150 ms and 200 ms inclusive on colour, background-colour, border-colour and/or text-decoration-colour only. `transition-property` never includes `all`, `outline*` or the property drawing the focus indicator, so the focus indicator is complete in the first frame after focus.
  - (b) On `/summary` with lessons, the paid segment of the bar runs one grow animation (iteration count 1, duration ≤ 1000 ms) when the panel appears after "Loading…". After mark/undo the bar takes its new size with no animation.
  - (c) The values of Home's four figures and of the `/summary` panel (totals values, percentage text, average text) run one fade-in animation (iteration count 1, duration ≤ 1000 ms) when they appear after "Loading…"; after mark/undo they change with no animation. Their text is in the accessibility tree from the first frame.
  - (d) On `/summary`, a test-created teacher with the F03 AC-1 data marks lesson B as paid: the row runs one green highlight animation (iteration count 1, duration ≤ 1000 ms), its Status reads "Paid", and the F03 announcement and focus target are unchanged and immediate. At the highlight's strongest colour, every text in the row has ≥ 4.5:1 contrast, the "Undo paid" border ≥ 3:1 and the focus indicator ≥ 3:1. "Undo paid", a failed mark, and "Mark as paid" on `/pending` and `/` produce no highlight; on those two pages the row leaves at once as today.
  - (e) No element anywhere has `animation-iteration-count` other than 1, and no animation or transition exceeds 1000 ms.
- **AC-5** (reduced motion): Given `prefers-reduced-motion: reduce`, then:
  - (a) On every page and every state checked by the F05 AC-6 / F07 AC-6 per-state checks, the longest transition or animation is ≤ 0.01 ms (existing definition).
  - (b) On load of `/summary` (F06 AC-4 data), the first measurement shows the paid segment at 41% (±1 point) and every figure at opacity 1. After marking lesson B, the row's computed background equals an unhighlighted row's in the first measurement.
  - (c) The Playwright suite runs every test with `reducedMotion: "reduce"` by default. Exactly one test file overrides it: it runs AC-4 (a)–(d) with `no-preference`, then the same elements with `reduce` and asserts (a)–(b) of this AC. It reads computed styles and animation state only, never waits on elapsed time or frames, and passes 10 consecutive runs (`--repeat-each=10`).
- **AC-6** (regressions, accessibility, devices, docs, gate): Given the production build, then:
  - (a) The F05 AC-6 (a)–(g), F06 AC-6 (a)–(d) and F07 AC-6 (a)–(c) checks pass on all seven pages in their checked states plus the states of AC-3, including target size (2.5.8) and focus not obscured (2.4.11) with icons and logo in place. At 320, 375, 768 and 1280 px there is no horizontal page scroll; at 1920 px `main` is within the `content` width; at 667×375 nothing fixed or sticky covers focus; at 1280×800 with 200% root text no icon, logo, wordmark or illustration is clipped, overlaps text, or pushes content outside the viewport horizontally.
  - (b) `make check` and `make e2e` pass. The diff of pre-existing tests removes or weakens no behaviour assertion. Allowed changes: selectors tied to CSS classes; the suite-wide reduced-motion setting; and tests encoding "no motion" or "no logo or illustrations" (theme, design-doc and composition tests), replaced by tests of the ADR-007 rules (motion tokens only, `hover:` with `focus-visible:` twin, no literal colours, pixel sizes, arbitrary values or `style` attributes).
  - (c) The `Content-Security-Policy` header of every page is byte-identical to F07's and no `securitypolicyviolation` event fires on any page, with or without reduced motion. The icon package is an exact-pinned dependency in `package.json` with its lock entry, and the dependency scan passes.
  - (d) `docs/design.md` records: the icon set, version and ISC licence; the icon map and icon size names; logo, favicon and illustrations (original, theme colours); the motion tokens (durations, easings, highlight colour) and the ADR-007 rules; "Product logo" moved from left out to adopted in "Reference elements". The repository's agent notes no longer say "no motion" and state the ADR-007 rules; no source comment says the design has no motion.
  - (e) The "Screenshots" section of `docs/design.md` lists 18 files taken from this feature's production build with reduced motion: the 7 pages at 375 and 1280 px (app pages as `alice@example.com`, current month), plus `/` and `/students` as `bob@example.com` at 375 and 1280 px. The files exist.

## Behavior
- **Defaults chosen** (owner pre-authorised defaults; listed for review):
  - **Icon map** (Lucide names): Home `house`; Lessons `music`; Students `users`; Monthly summary `chart-column`; Pending payments `clock`; Record lesson `calendar-plus`; Add student `user-plus`; Mark as paid `check`; Undo paid `undo-2`; Log out `log-out`; alert `circle-alert`. The owner judges them at the gate.
  - **Icon size** scales with the text it sits next to (theme size name, relative to font size), so it grows at 200% text. The gap between icon and text is a theme spacing name.
  - **Alerts** (R16): the shared alert component's messages only. `role="status"` regions get no icon.
  - **Login and sign-up** (R17) have no visible product name today (h1 "Log in" / "Create your account"; the name is only in the document title), so they get no logo.
  - **Wordmark** is plain text in the shell header, not a link to Home and not a heading, so Tab order, landmarks and the single `h1` are unchanged.
  - **Home's in-section messages** (R15) get no illustration: with "Get started" Home already has one, and the short messages sit between figures and tables where an illustration would crowd the overview.
  - **Motion values** are theme tokens: interaction 150–200 ms; bar grow ≤ 600 ms; figure fade ≤ 300 ms; highlight ≤ 1000 ms, one fade from a green wash to the row background. Load motion animates opacity and transform only, so layout is final in the first frame. Load motion runs when data appears after "Loading…" (page load, month change, "Try again"), not on in-place updates.
  - **Highlight** (R14) only on `/summary` "Mark as paid" success, once per success. The status word change stays the cue; the highlight is extra. No flashing: one fade, never more than one luminance change per second.
  - **No icon while "Saving…"** so a check mark never sits next to a pending action. No spinner (it would be motion outside ADR-007's list).
  - **Favicon** is the one static asset that carries literal colour values, because it cannot use theme classes; they equal theme token values. Inline logo and illustrations use theme names or `currentColor`.
- **Illustrated states** (seed accounts read-only in tests; e2e may use test-created teachers in the same state):
  - Home "Get started": `bob@example.com` on `/`.
  - Students "You have no students yet. Add your first student with the form above.": `bob@example.com` on `/students`.
  - Lessons "No lessons recorded yet.": `bob@example.com` on `/lessons`.
  - Monthly summary "No lessons in {Month YYYY}.": `bob@example.com` on `/summary`; also `alice@example.com` on `/summary?month=2000-01`.
  - Pending payments "Nothing pending. Every lesson is paid.": `bob@example.com` on `/pending`.
- **Motion states for the live try-out**: hover/focus on any page; bar and figures on `/summary` and `/` as `alice@example.com`; highlight by marking one of alice's 3 unpaid current-month lessons on `/summary` (this changes alice's data).
- **Theme rules** (ADR-005, ADR-006, ADR-007): theme names only; no literal colours, pixel sizes, arbitrary values or `style` attributes in components; keyframes defined once in the shared styles; every `hover:` cue has a `focus-visible:` twin. CSS only, no animation library, no JavaScript animation loops.
- **Merge gate** (ADR-006, ADR-007; outside the Approver's check): the orchestrator shows the owner the 18 screenshots of AC-6 (e), leaves the stack running with seed data, gives the `APP_URL` and the seed credentials (`alice@example.com`, `bob@example.com`), and asks "Do you approve the icons, logo, illustrations and motion?" as its own question. A rejection loops back into F08.

## Interfaces

### API
None.

### Data model
None.

### Configuration
- New frontend dependency: `lucide-react`, exact version pinned, ISC.
- New static asset `GET /favicon.svg` (`image/svg+xml`), same origin and headers as the app. CSP unchanged.
- E2E default `prefers-reduced-motion: reduce` (AC-5 c).

## UI
Design reference: `docs/design.md`, ADR-006, ADR-007. States of every page are those of F05-F07; only these change:
- **Shell (app pages)**: logo and wordmark at the top of the sidebar / start of the top bar; icons on links and "Log out"; logging-out state unchanged (icon stays, button disabled); log-out error alert with icon.
- **`/`**: default as F07 with figure fade and icons on quick actions and "Mark as paid"; empty (new teacher) "Get started" with illustration; saving (no icon); error alerts with icon; load error alert with icon.
- **`/students`, `/lessons`**: empty state with illustration; submit button with icon; form-level alerts with icon.
- **`/summary`**: default with bar grow and figure fade; empty month with illustration; saving (no icon); success with highlight; mark/undo error alert with icon.
- **`/pending`**: default; empty with illustration; saving (no icon); success (row leaves, no highlight); error alert with icon.
- **`/login`, `/signup`**: unchanged except the alert icon and button/link transitions.
- **No permission**: redirect to `/login`, unchanged.
- Every state above under reduced motion: final state at once.

## Security considerations
- No change to who can access what; no new endpoints, inputs, stored data or data leaving the system.
- CSP `default-src 'self'` stays byte-identical: icons are bundled, the favicon is served from the app's origin, and SVGs carry no `style` attributes, `data:` URIs, scripts or external references.
- New third-party dependency (`lucide-react`): exact-pinned, lock file committed, must pass the dependency scan; it renders static SVG only.
- Icons, logo and illustrations are hidden from assistive technology and do not alter names, so no control can be mistaken for another.

## Non-functional
- WCAG 2.2 AA on all seven pages, with and without reduced motion: 2.3.3 (motion off under reduce), 2.3.1 (no flashing), 2.2.2 (no loops, nothing > 1 s), 1.4.3/1.4.11 (contrast including during the highlight), 2.4.7/2.4.11 (focus visible at once, not obscured), 2.5.8 (target size), 1.4.4/1.4.10 (200% text, reflow at 320 px).
- Responsive: 320, 375, 768, 1280, 1920 px, 667×375, 200% text (AC-6 a).
- E2E deterministic: AC-5 (c).

## Out of scope
- Any behaviour change: routes, copy, accessible names, validation, API calls, focus handling, live-region messages, table column order, the totals description list.
- Icons other than AC-1 (a); icon-only controls.
- Motion other than AC-4; page transitions, skeletons, scroll effects, loops, spinners; motion on in-place figure or bar updates.
- Highlight on rows that leave a list (`/pending`, `/`) or on "Undo paid".
- Logo on `/login` and `/signup`; wordmark as a link; illustrations on Home's in-section messages or on loading/error states.
- Photos, raster or animated illustrations, a colour or typography rebrand, a new page.
- Backend, API, OpenAPI or seed changes.
- Open `pilot-notes.md` findings unless an element added here causes them.

## Traceability
| Expected result | Criteria |
|---|---|
| Icons on sidebar links, action buttons and alerts; text and announced names unchanged | AC-1 |
| Original logo mark with wordmark in sidebar and top bar; matching favicon | AC-2 |
| Illustration in "Get started" and list empty states; text unchanged | AC-3 |
| 150-200 ms hover/focus transitions; bar grows and figures fade on load; just-paid row highlights green where it stays | AC-4 |
| Nothing moves under reduced motion; e2e runs under reduced motion; one on/off check | AC-5 |
| Behaviour, WCAG 2.2 AA, multi-device checks; owner approval on screenshots and live | AC-6; merge gate in Behavior |

## Open questions
None.

## Changelog
