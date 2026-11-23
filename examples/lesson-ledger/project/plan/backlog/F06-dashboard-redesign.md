---
id: F06
project: PRJ-001
type: improvement
priority: high
milestone: v1
depends_on: [F05]
touches_frontend: true
adrs: [ADR-001, ADR-002, ADR-003, ADR-004, ADR-005, ADR-006]
---

## Problem
The owner rejected the "manuscript paper" visual identity delivered by F04 and F05 (green-grey paper, Alegreya, stave lines, note heads, piano-key buttons) and wants the app to look like a clean product dashboard, as described in `context/design-direction.md` with `context/design-reference.png` as the reference. Every page currently carries the rejected look.

## Affected user
Teacher, on every page (login, sign-up, home, lessons, students, monthly summary, pending payments, and the app shell around them), on phone, tablet or desktop. Project owner, who approves the look before this feature is merged.

## Expected result
- The design plan in `docs/design.md` and the theme describe and implement the dashboard direction of ADR-006, with sizes that match what the app renders; nothing of the manuscript identity remains (stave, note heads, piano-key buttons, its palette and its fonts).
- App pages sit in a shell with a dark left sidebar holding Home, Lessons, Students, Monthly summary and Pending payments, log out at the bottom and a non-colour cue for the current page, next to a white main area with a large sans-serif page title and the page's actions at the top right (primary solid black, secondary outlined). Login and sign-up use the same direction without the sidebar.
- Lessons, pending payments and the monthly summary's lessons show dense tables with grey column headers, thin row dividers, the student's initials in a circle next to the name, and status as "✓ Paid" (green) or "Unpaid" (amber or red), always with the word; the students page follows the same style.
- The monthly summary shows the month selector as a chip and a right-hand metrics panel with collected, pending, lesson count, a paid versus pending bar with its figures as text, and the average per lesson, all from data the page already loads; on narrow screens the panel stacks with the content.
- Every page keeps working exactly as before and meets WCAG 2.2 AA, passing the multi-device checks of F04 and F05: widths 320 (reflow), 375, 768, 1280 and 1920, 667x375 landscape, and text at 200%.
- Before merge, the owner is shown screenshots of every page listed under Affected user, at 375 and 1280 px wide, and approves the look explicitly; without that approval the feature is not merged.

## Out of scope
- New functionality shown in the reference: search, extra filters, row checkboxes and bulk actions, row detail popover, import and export, notifications, and navigation items for pages that do not exist (Inventory, Help, Settings).
- Any behaviour change: routes, copy, form validation, error handling, API calls, session handling, mark-as-paid and undo flows, month navigation behaviour. The month chip changes how the selector looks, not what it does.
- New data or API changes. The metrics panel only presents values the summary already has or can derive on the page (lesson count, average per lesson).
- Dark mode, theme switching, a logo or illustration set.
- Changing the CSS framework or ADR-005's theme rules.
- Fixing the open non-blocking findings in `pilot-notes.md`, unless a redesigned element is the cause.

## Constraints
- No behaviour change. Existing unit and e2e tests keep their assertions about behaviour; a test may change only a selector tied to styling. Tests that assert the manuscript identity itself (old design-plan contents, old theme names and values, the stave, the pinned column's bar line) are replaced by tests of the new direction.
- Keep the structure the e2e tests and assistive technology rely on: tables with their current column order (the initials circle sits inside the student cell, not in a new column), monthly totals as a description list, landmarks, one main navigation, headings, labels, live regions and error associations.
- WCAG 2.2 AA (ADR-006), including contrast on the dark sidebar and black buttons, focus visible on dark and light grounds, focus not obscured, target size, reduced motion. Status and the paid versus pending bar never rely on colour alone; decorative initials are not announced in place of the name.
- Multi-device checks as in F05: no horizontal page scroll at 320, 375, 768 and 1280 px (tables may scroll inside their own region without hiding which row a value belongs to); content width and line length limits at 1920 px; at 667x375 fixed or sticky regions never cover focused elements; at 200% text nothing is clipped or lost. The sidebar must adapt on narrow screens with every navigation link and log out reachable by keyboard and touch, without hover-only cues.
- CSP stays `default-src 'self'`; fonts are self-hosted with a licence allowing redistribution; unused font files are removed.
- Theme rules from `policies/conventions.md` §1 Styling and ADR-005: no literal colours, pixel sizes or arbitrary values in components.
- The owner's direction in `context/design-direction.md` overrides the `frontend-design` skill's advice against generic dashboard looks; reviewers judge against ADR-006, `docs/design.md` and the reference.
- Merge gate (`pilot-notes.md` finding 15): the merge request to the owner shows the screenshots of every page and asks "Do you approve the look?" as a separate question from any technical decision. A rejection loops back into this feature.
- `make seed` must still reach every page state already described in the F01, F02 and F03 specs, so the screenshots can show pages with data.

## Context
- `context/design-direction.md` (owner direction, 2026-11-18) and `context/design-reference.png` (the "Mate" orders screen).
- ADR-006 (dashboard visual identity), ADR-005 (Tailwind and theme rules that stand), ADR-002 (CSP and production build), ADR-003 (data shown on the pages), ADR-004 (log out in the shell).
- F04 and F05 entries, specs and builds: the identity being replaced, the shared components to restyle, and the multi-device acceptance checks to reuse (`specs/F05-restyle-remaining-pages.md` AC-6).
- Specs of the pages: `specs/F01-teacher-accounts.md` (login, sign-up, home), `specs/F02-students-and-lessons.md`, `specs/F03-monthly-summary-and-payments.md`.
- `pilot-notes.md` finding 15 (visual design gate) and the F04 root font size mismatch.
