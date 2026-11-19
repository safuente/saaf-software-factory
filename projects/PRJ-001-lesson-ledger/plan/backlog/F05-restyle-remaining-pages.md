---
id: F05
project: PRJ-001
type: improvement
priority: high
milestone: v1
depends_on: [F04]
touches_frontend: true
adrs: [ADR-001, ADR-002, ADR-003, ADR-005]
---

## Problem
After F04, the shell, navigation, login and sign-up use the approved visual identity, but the pages teachers use every day (home, students, lessons, monthly summary, pending payments) still use the old hand-written styles. The app looks inconsistent and keeps two styling systems side by side.

## Affected user
Teacher, logged in, adding students, recording lessons, reviewing the month and settling pending payments, on phone, tablet or desktop.

## Expected result
- Home, students, lessons, monthly summary and pending payments pages follow `docs/design.md` and use F04's theme and shared components.
- Data-heavy views (lessons table, monthly totals and lesson list, pending list and total) are easy to scan in the new style, and payment status stays conveyed by text, not only by color.
- No hand-written CSS modules and no separate tokens file remain in the frontend; any remaining custom CSS is limited to what the framework cannot express and uses the theme.
- Every page keeps working exactly as before: same routes, copy, forms, validation, empty, loading and error states, and mark-as-paid and undo flows.
- All pages meet WCAG 2.1 AA (contrast for text and UI components, visible focus, reduced motion respected) with no horizontal page scroll at 375, 768 and 1280 px; wide tables scroll inside their own region without hiding which row a value belongs to.

## Out of scope
- Changing the visual identity defined in F04. If a page needs something the design plan does not cover, extend it consistently and record the addition in `docs/design.md`.
- Any behavior change, new pages, new data or API changes.
- Fixing the open non-blocking findings in `pilot-notes.md`, unless a restyled element is the cause (for example F03 UI-1, "Next month" wrapping at 375px, is expected to be resolved by the new layout).

## Constraints
- No behavior change. Existing unit and e2e tests keep passing without changes to what they assert; a test may only change a selector that depended on a CSS class.
- Keep the structure the e2e tests rely on: tables with their current column order, monthly totals as a description list, landmarks, headings, labels and live regions.
- CSP stays `default-src 'self'`; no external resources.
- WCAG 2.1 AA (`questions.md` A11); no horizontal page scroll at 375, 768 and 1280 px.
- Theme rules from `policies/conventions.md` §1 Styling; no literal colors, pixel sizes or arbitrary values.
- `make seed` must still reach every state of these pages already described in the F02 and F03 specs (empty, many items, errors).

## Context
- F04 output: `docs/design.md`, the theme and the shared components, as approved by the owner.
- ADR-005 (styling and visual identity), ADR-003 (data shown on these pages), ADR-002 (CSP and production build).
- Specs of the pages being restyled: `specs/F01-teacher-accounts.md` (home), `specs/F02-students-and-lessons.md`, `specs/F03-monthly-summary-and-payments.md`.
- `pilot-notes.md` "Open non-blocking suggestions" (F02 UX-3 columns hidden in the 375px scroll; F03 UI-1).
