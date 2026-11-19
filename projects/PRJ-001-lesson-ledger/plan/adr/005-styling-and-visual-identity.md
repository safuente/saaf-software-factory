# ADR-005: Styling with Tailwind CSS and a defined visual identity

- Status: proposed; visual identity (subject-driven direction, two-feature migration) superseded by ADR-006
- Date: 2026-11-18

## Context
ADR-001 chose plain CSS modules with no component library. F00 to F03 were built that way: a minimal, accessible shell with hand-written CSS modules and a tokens file, with no defined visual identity.

Since then, `policies/conventions.md` §1 "Styling" requires every project with a frontend to use a CSS framework, with Tailwind CSS as the default and tie-breaker. It also requires the visual identity to be defined with the `frontend-design` skill and written to `docs/design.md` in the project repository, with the framework theme implementing it.

The project owner asked for a distinctive frontend that does not look like a typical AI-generated UI (revision request, 2026-11-18). `brief.md` has no brand direction; the owner's only direction is "not AI-typical". The subject sets the tone: independent music teachers (`brief.md` Vision, Users and roles) who track lessons and who owes them, and who currently use notebooks and spreadsheets and feel awkward chasing payments (`context/research.md`).

Fixed constraints that carry over:
- The frontend is a production build served from the same origin, with `Content-Security-Policy: default-src 'self'` (ADR-002, F00). Fonts, stylesheets and images must come from the app's own origin.
- WCAG 2.1 AA (`questions.md` A11).
- Existing unit and e2e tests define the behavior and must keep passing.

## Decision
- **Framework**: Tailwind CSS, latest stable major, installed as a frontend dependency, pinned in the lock file and built with the frontend. No CDN. This supersedes ADR-001's styling choice ("plain CSS (CSS modules)"); the rest of ADR-001 stands.
- **Visual identity**: defined with the `frontend-design` skill and written to `docs/design.md` in the repository: palette, typefaces and type scale, layout concept, design principles, and an explicit list of what was changed versus generic defaults (the choices that keep it from looking like a typical generated UI). The subject drives it, since the brief gives no brand: the world of an independent music teacher and a ledger of lessons and payments.
- **The theme is the design system**: colors, typography, spacing, radii and breakpoints are defined once in the Tailwind theme and implement `docs/design.md`. Components use theme names, never literal colors, pixel sizes or arbitrary values.
- **Shared components** in the frontend's shared area wrap the framework (buttons, form fields, tables, status and error messages, page layout, navigation) and are reused by every page.
- **Hand-written CSS** is removed: no CSS modules and no separate tokens file remain once the migration is done. Custom CSS is allowed only for what Tailwind cannot express, kept in the shared styles area and using theme variables.
- **Fonts are self-hosted**: font files ship with the frontend build and are served from the app's origin. Only fonts whose license allows self-hosting and redistribution.
- **Accessibility**: theme colors meet WCAG 2.1 AA contrast for text and UI components; focus is always visible; motion respects the user's reduced-motion preference; no horizontal page scroll at 375, 768 and 1280 px wide.
- **Migration in two features**: F04 sets up Tailwind, writes `docs/design.md`, builds the shared components and restyles the app shell, navigation, login and sign-up. The owner approves the visual direction when F04 is merged. F05 applies it to the remaining pages and removes the remaining CSS modules and tokens file. Between F04 and F05 both styling systems coexist, which is acceptable only for that interval.

## Alternatives considered
- Keep CSS modules and only redesign: contradicts the conventions' Styling section (no project styles with hand-written CSS only).
- Bootstrap: conventions reserve it for admin and back-office tools where ready-made components matter more than a distinctive look, the opposite of the owner's request.
- A component library on top of Tailwind: ready-made components bring a recognizable generic look and their own accessibility assumptions; the app has few screens, so own shared components are enough.
- Fonts from a hosted font service: blocked by the CSP and adds an external dependency.
- One feature for the whole redesign: the owner could only judge the look after it was applied to every page, making a change of direction expensive.

## Consequences
- Every later frontend feature follows `docs/design.md` and the theme, uses the shared components, and changes the visual identity only when its spec asks for it.
- The redesign changes no behavior: routes, copy, form validation, API calls and the accessible structure (landmarks, headings, labels, tables and their column order, live regions) stay the same, so the existing tests keep passing. Tests may only change selectors that depended on a CSS class.
- The UI reviewer checks F04 and F05 against `docs/design.md` and the theme rules, not only against generic accessibility.
- Font files add weight to the frontend build; `docs/design.md` should keep the number of families and weights small.
