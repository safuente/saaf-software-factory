---
id: F04
project: PRJ-001
type: improvement
priority: high
milestone: v1
depends_on: [F03]
touches_frontend: true
adrs: [ADR-001, ADR-002, ADR-004, ADR-005]
---

## Problem
The app works but has no visual identity: it is a minimal shell with hand-written styles, and the project owner wants a distinctive look that does not resemble a typical AI-generated UI. The project also does not follow the factory's Styling convention (a CSS framework whose theme is the design system). The owner needs to see and approve the visual direction on a few screens before it is applied to the whole app.

## Affected user
Teacher, on first contact with the app (sign-up and login) and on every page through the shared shell and navigation. Project owner, who approves the visual direction when this feature is merged.

## Expected result
- The repository has a design plan in `docs/design.md`, made with the `frontend-design` skill, covering palette, typefaces and type scale, layout concept, design principles, and what was deliberately changed versus generic defaults; its direction comes from the subject (independent music teachers keeping a ledger of lessons and payments).
- The CSS framework from ADR-005 is part of the frontend build, and its theme implements the design plan: colors, typography, spacing, radii and breakpoints are defined once and used by name.
- Shared components (buttons, form fields, tables, status and error messages, page layout, navigation) exist in the new style and are ready for F05 to reuse.
- The app shell, main navigation, login page and sign-up page use the new identity and shared components; the hand-written styles they used are removed.
- Fonts load from the app's own origin; with the existing Content Security Policy unchanged, the browser reports no blocked resources on any page.
- Every page keeps working exactly as before, and the restyled pages meet WCAG 2.1 AA (contrast for text and UI components, visible focus, reduced motion respected) with no horizontal scroll at 375, 768 and 1280 px.

## Out of scope
- Restyling home, students, lessons, monthly summary and pending payments pages (F05). They may look inconsistent with the new shell until F05 is merged.
- Removing the tokens file or CSS modules still used by pages F05 restyles.
- Any behavior change: routes, copy, validation, error handling, API calls, session handling.
- New pages, a logo or illustration set, dark mode, theme switching.
- Fixing the open non-blocking findings listed in `pilot-notes.md`, unless a restyled element is the cause.

## Constraints
- No behavior change. Existing unit and e2e tests keep passing without changes to what they assert; a test may only change a selector that depended on a CSS class.
- Keep the accessible structure the tests and assistive technology rely on: landmarks, headings, labels, live regions and error associations.
- CSP stays `default-src 'self'`: no external CDN for fonts or styles, no inline styles in the HTML document. Self-hosted fonts must have a license that allows redistribution.
- WCAG 2.1 AA (`questions.md` A11); no horizontal scroll at 375, 768 and 1280 px.
- Theme rules from `policies/conventions.md` §1 Styling: no literal colors, pixel sizes or arbitrary values in components; no focus style removed without a replacement.
- The owner approves the visual direction at merge. If the owner rejects it, the change goes back through this feature, not F05.

## Context
- Owner request (revision 2026-11-18): distinctive design, "not AI-typical"; no brand direction in `brief.md`.
- `brief.md` Vision and Users and roles; `context/research.md` for who the teachers are.
- `policies/conventions.md` §1 Styling.
- ADR-005 (styling and visual identity), ADR-002 (production build behind the same-origin server with CSP), ADR-001 (frontend stack, styling superseded by ADR-005).
- `pilot-notes.md` "Open non-blocking suggestions" (F03 UI-1: "Next month" wraps at 375px) as a known layout issue to keep in mind for the shell.
