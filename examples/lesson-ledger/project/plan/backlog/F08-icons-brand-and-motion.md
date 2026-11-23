---
id: F08
project: PRJ-001
type: improvement
priority: medium
milestone: v1
depends_on: [F07]
touches_frontend: true
adrs: [ADR-001, ADR-002, ADR-005, ADR-006, ADR-007]
---

## Problem
After F07 the app works and has the dashboard look, but it is text only: no icons to help the teacher scan the navigation and actions, no logo or favicon to recognise the product or its browser tab, empty states and Home's "Get started" box are plain text, and nothing gives feedback through motion, so hover, loading figures and marking a lesson as paid feel abrupt. The owner asked for icons, an image/brand and subtle animation after F07 merged (owner request 2026-11-19). The project's rules currently exclude motion and a logo (ADR-007 Context).

## Affected user
Teacher using the app on phone, tablet or desktop, including teachers who browse with reduced motion enabled, with a screen reader, or with enlarged text. Project owner, who approves the result on screenshots and on the running app before merge.

## Expected result
- Each sidebar link (Home, Lessons, Students, Monthly summary, Pending payments), each action button (Record lesson, Add student, Mark as paid, Undo paid, Log out) and each alert shows an icon from the ADR-007 icon set next to its unchanged visible text; screen readers announce the same names as before.
- An original logo mark with the "Lesson Ledger" wordmark sits at the top of the sidebar and of the narrow-screen top bar, and the browser tab shows a matching favicon.
- Home's "Get started" box and the empty states of the lists show a simple original illustration, while their text stays unchanged.
- Buttons and links change on hover and focus with a 150-200 ms transition; on load the paid/pending bar grows and the metric figures fade in; a lesson just marked as paid on a page where its row stays visible briefly highlights green.
- With reduced motion requested, nothing moves: every element shows its final state at once, which the e2e tests check, and the e2e suite runs with reduced motion so it stays deterministic.
- Every page keeps its behaviour, meets WCAG 2.2 AA and the F04-F07 multi-device checks, and the owner approves icons, brand and motion on screenshots and on the running app before merge.

## Out of scope
- Any behaviour change: routes, copy, accessible names, form validation, API calls, focus handling, live-region messages, table column order and the totals description list stay as they are.
- Icons anywhere other than the places listed above (for example table cells, the payment status, form fields or the month chip), and icon-only controls.
- Motion other than the four uses listed above, for example page transitions, animated route changes, skeleton loaders, scroll effects or looping animations.
- A highlight when a row leaves its list after "Mark as paid" (Pending payments, Home); those rows are removed as today, without delay.
- Photos, raster illustrations, animated illustrations, a rebrand of colours or typography, or a new page.
- Backend changes.
- Fixing the open non-blocking findings in `pilot-notes.md`, unless an element added here is the cause.

## Constraints
- ADR-007: the Lucide icon set, bundled and pinned, no CDN; CSP `default-src 'self'` unchanged; SVGs without inline `style` attributes, `data:` URIs or external references; licence recorded.
- Icons, logo mark and illustrations are decorative and hidden from assistive technology; the visible text next to them carries the meaning and the accessible names do not change. The current page in the sidebar keeps its non-colour cue; an icon is not that cue.
- Logo and illustrations are original work, not copied from or imitating an existing brand or illustration set, and use theme colours only.
- Theme rules of ADR-005 and ADR-006: motion durations and easings, icon sizes and any new colours are theme tokens; no literal colours, pixel sizes, arbitrary values or `style` attributes in components; every hover cue keeps its focus-visible twin.
- Motion (ADR-007, WCAG 2.2 AA): off under reduced motion (2.3.3); nothing flashes (2.3.1); no loops or long animations (2.2.2); content, focus and interaction are never delayed; the focus indicator shows at once; text keeps contrast during the highlight; the highlight is never the only cue, the status word still changes.
- Accessibility and layout: WCAG 2.2 AA on every page, including target size and focus not obscured with icons in place; no horizontal page scroll at 320, 375, 768 and 1280 px; content width limits at 1920 px; at 667x375 fixed or sticky regions never cover focused elements; at 200% text icons, logo and illustrations do not clip or push content off screen.
- Tests: existing behaviour tests keep their assertions; tests that encode "no motion" or "no logo or illustrations" (design-doc, theme and composition tests) change to the ADR-007 rules. E2E runs with reduced motion, plus one check that motion is present without the preference and off with it.
- `docs/design.md` and the repository's agent notes are updated to ADR-007 (icon set, brand, illustrations, motion tokens and rules; "Product logo" moves from left out to adopted).
- Merge gate (ADR-006, ADR-007): the owner is shown screenshots of every page at 375 and 1280 px with seed data, taken with reduced motion, plus Home and one empty state as a new teacher. The stack is left running with seed data and the URL and seed credentials are given so the owner can try the motion live. The owner is asked "Do you approve the icons, logo, illustrations and motion?" as its own question. A rejection loops back into this feature.

## Context
- Owner request 2026-11-19 (`plan/README.md`, Revision 2026-11-19 c).
- ADR-007 (icons, brand and motion), ADR-006 (dashboard identity, approval gate), ADR-005 (theme rules), ADR-002 (CSP).
- `specs/F06-dashboard-redesign.md` (shell, sidebar and top bar, metrics panel and bar, multi-device checks), `specs/F07-home-overview.md` ("Get started" box, Home states, metric figures), `specs/F03-monthly-summary-and-payments.md` (mark and undo paid behaviour, rows that stay versus rows that leave), `specs/F02-students-and-lessons.md` (empty states of Students and Lessons).
- `pilot-notes.md` findings 15 and 17 (visual gate, pages with content).
