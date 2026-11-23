---
id: F09
project: PRJ-001
type: improvement
priority: medium
milestone: v1
depends_on: [F08]
touches_frontend: true
adrs: [ADR-002, ADR-004, ADR-005, ADR-006, ADR-007, ADR-008]
---

## Problem
After F08 the app shell carries the logo and the dashboard colours, but the pages a teacher sees before entering and after leaving, Log in and Sign up, are a plain white form with no brand image and no colour. Log out has no page of its own; it returns the teacher to Log in with nothing confirming they have left. The owner found these pages "a bit plain" (owner feedback 2026-11-19). F08 left them unbranded on purpose because ADR-007 kept the brand in the shell only; ADR-008 now allows it.

## Affected user
Teacher opening the app, creating an account or logging out, on phone, tablet or desktop, including teachers who use reduced motion, a screen reader or enlarged text. Project owner, who approves the look on screenshots and on the running app before merge.

## Expected result
- From 1024 px wide, Log in and Sign up show a split layout: on the left a dark brand panel with the logo mark, a larger "Lesson Ledger" wordmark, the value line "Lessons, payments and pending fees in one place" and a new original illustration in the F08 style; on the right the existing form on a white card using the theme's accent.
- Below 1024 px, the same pages show a brand strip at the top with the mark, the wordmark and the value line, the form under it, and no illustration.
- After "Log out", the Log in page shows a short themed notice "You have logged out"; reaching Log in any other way (direct visit, redirect from an app page, expired session) shows no notice.
- The brand panel enters gently once when the page appears; with reduced motion requested it shows at once, and the form is usable from the first frame in both cases.
- Fields, labels, validation, error messages, focus handling, links between Log in and Sign up, and the single heading of each page are exactly as F01 defined them (as restyled through F08), and both pages meet WCAG 2.2 AA and the F04-F08 multi-device checks.
- The owner approves the new Log in and Sign up look, including the notice and the entrance, on screenshots and on the running app before merge.

## Out of scope
- Any change to sign-up, log-in or log-out behaviour beyond the logged-out notice: routes, fields, copy of headings, labels and errors, validation rules, API calls, session handling, redirects.
- Backend, API or seed changes.
- Changes to the app shell or any signed-in page.
- A separate logged-out page, a "remember me" option, password reset or any new control on these pages.
- Making the wordmark a link or a heading.
- Aligning the F01 network-error copy with later pages (`pilot-notes.md` finding 13) and other open findings, unless an element added here is the cause.
- Photos, raster or animated illustrations, and any colour or typography rebrand.

## Constraints
- ADR-008 and ADR-007: mark, wordmark and illustration are decorative or plain text (the mark and illustration hidden from assistive technology, the wordmark not a heading, link or Tab stop); the illustration is original, inline, theme colours only; SVGs have no `style` attributes, `data:` URIs, scripts or external references; CSP unchanged.
- Reuse the existing brand and illustration components and the F08 illustration line language; the new illustration must not imitate an existing brand or illustration set.
- Theme rules of ADR-005 and ADR-006: theme names only, no literal colours, pixel sizes, arbitrary values or `style` attributes; any new size or colour is a theme token. Text on the dark panel (wordmark, value line) and the notice meet WCAG 2.2 AA contrast.
- The logged-out notice is a status message, not an error alert: announced politely, not styled as an error, its text carries the meaning (colour is not the only cue). It does not move focus, does not persist across a reload, and adds no cookie, query parameter visible to the teacher or browser storage beyond what the router already keeps. A failed log out keeps today's behaviour (the teacher stays in the app with the error alert) and shows no notice.
- Entrance motion per ADR-008: once per page appearance, opacity and/or transform only, within ADR-007's limits, theme tokens, off under reduced motion; the form is interactive and in its final layout from the first frame. The e2e on/off motion check covers it.
- Accessibility and layout: one `main`, one `h1`, unchanged Tab order and accessible names on both pages; no horizontal page scroll at 320, 375, 768 and 1280 px; content width limits at 1920 px; at 667x375 nothing fixed or sticky covers focused elements (the brand strip is not sticky); at 200% text the brand panel, strip and illustration do not clip or push the form off screen horizontally.
- Tests: existing F01 behaviour tests keep their assertions. F08's checks that Log in and Sign up show no logo, no wordmark and no `svg` are replaced by checks of ADR-008. `docs/design.md` (Brand, Illustrations, Motion, Screenshots) and the repository's agent notes ("shell only", illustrations "only" list) are updated to ADR-008.
- Merge gate (ADR-006, ADR-007, ADR-008): the owner is shown screenshots of Log in and Sign up at 375 and 1280 px taken with reduced motion, plus Log in with the logged-out notice and Log in with a validation error at 1280 px. The stack is left running with seed data so the owner can see the entrance live. The owner is asked "Do you approve the new Log in and Sign up pages?" as its own question. A rejection loops back into this feature.

## Context
- Owner feedback and approved direction 2026-11-19 (`plan/README.md`, Revision 2026-11-19 d).
- ADR-008 (brand on signed-out pages), ADR-007 (icons, brand, illustrations, motion rules), ADR-006 (dashboard identity, approval gate), ADR-005 (theme rules), ADR-004 (sessions, log out), ADR-002 (CSP).
- `specs/F01-teacher-accounts.md` (fields, errors, focus, log out), `specs/F08-icons-brand-and-motion.md` (AC-2 (b) to replace, brand and illustration style, motion tests), `specs/F06-dashboard-redesign.md` (multi-device checks, `lg` breakpoint of the shell).
- `pilot-notes.md` findings 13, 15 and 17.
