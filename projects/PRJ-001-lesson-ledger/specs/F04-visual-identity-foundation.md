---
id: F04
project: PRJ-001
entry: projects/PRJ-001-lesson-ledger/plan/backlog/F04-visual-identity-foundation.md
status: approved
version: 2
touches_frontend: true
adrs: [ADR-001, ADR-002, ADR-004, ADR-005]
---

# Visual identity and Tailwind foundation

## Summary
Lesson Ledger gets a defined visual identity, written down in `docs/design.md` and implemented as the Tailwind CSS theme. The app shell (header and main navigation on every app page), the login page and the sign-up page are rebuilt with shared components in the new style; nothing they do changes. The owner judges the visual direction on these screens at merge, before F05 applies it to the remaining pages.

## Acceptance criteria
- **AC-1**: Given the repository after this feature, when `docs/design.md` is read, then it contains sections for: palette (every color with a theme name, value, role, and the contrast ratio of each text or UI-component color against the background it is used on), typefaces (family, weights, license, and that the files are self-hosted), type scale, spacing, radii, breakpoints and maximum content width, layout concept, design principles, a rationale tying the direction to independent music teachers keeping a ledger of lessons and payments, and a "Changed versus generic defaults" list of at least 5 items, each naming the generic default and the choice made instead.
- **AC-2**: Given the frontend source, when it is inspected, then (a) Tailwind CSS is a frontend dependency pinned in the lock file and built with the frontend, with no CDN reference anywhere; (b) the Tailwind theme defines once every color, typeface, type-scale step, spacing step, radius and breakpoint named in `docs/design.md`, under the same names; (c) the shared components and the restyled parts (app shell, main navigation, login page, sign-up page) import no CSS module and no tokens file, use no `style` attribute, and use no literal color, pixel size or arbitrary value (`[...]`) in class names; (d) any custom CSS lives in the shared styles area and references only theme variables.
- **AC-3**: Given the frontend source, when the shared UI area is inspected, then it provides shared components for button, text field, select field, table, status message, error alert, load error with "Try again", page layout and main navigation in the new style, each covered by at least one unit test; the table component renders a native `table` with `th scope="col"` header cells so column-position selectors keep working; the login page, sign-up page and app shell are built only from these components.
- **AC-4**: Given the change, when `make check` and `make e2e` run, then both pass, and the diff of every pre-existing unit and e2e test removes or weakens no assertion; the only allowed edits to existing tests are selectors that depended on a CSS class name. Routes, visible text, labels, headings, document titles, validation, error messages, focus-on-heading behavior, landmarks, live regions and error associations of every page are unchanged.
- **AC-5**: Given the production build served at `APP_URL`, when `/login`, `/signup`, `/`, `/lessons`, `/students`, `/summary` and `/pending` are loaded (the last five as a logged-in teacher), then the `Content-Security-Policy` response header is byte-identical to before this feature, no `securitypolicyviolation` event fires and no request fails, every font request goes to the `APP_URL` origin, and `document.fonts` reports each typeface listed in `docs/design.md` as `loaded`; each font family's license file (allowing self-hosting and redistribution) is committed alongside the font files.
- **AC-6**: Given the production build, when the restyled parts are checked (`/login` and `/signup` in default, field-error and server-error states; the app shell header on every app page listed in AC-5, checks on app pages scoped to the header), then all of the following hold. Each is an automated Playwright e2e check unless marked *inspection*. Terms: *no horizontal page scroll* = document `scrollWidth` ≤ viewport width; *clipped* = a text element with `scrollWidth` > `clientWidth` or `scrollHeight` > `clientHeight` and computed `overflow` not `visible`; *overlap* = bounding boxes of two visible, non-nested interactive elements, labels, headings or messages intersecting by more than 1 CSS px.
  - (a) Accessibility: axe reports no violations for tags `wcag2a`, `wcag2aa`, `wcag21aa`, `wcag22aa`; every interactive element is at least 24×24 CSS px or meets the 2.5.8 spacing exception; when tabbing through each page, every focused element has a visible focus indicator (outline style not `none`, or a theme-defined ring) and no part of it is covered by a fixed or sticky element; with `prefers-reduced-motion: reduce` emulated, no element has a computed `transition-duration` or `animation-duration` above `0.01ms`.
  - (b) Common widths: at 375, 768 and 1280 px wide, every page listed in AC-5 has no horizontal page scroll, and all five main navigation links are visible, not overlapping and not in a collapsed menu.
  - (c) Reflow (WCAG 1.4.10) at 320×568: `/login` and `/signup` have no horizontal page scroll; every visible element of the restyled parts lies horizontally within 0–320 px, except content inside a table's own scroll container (as F02 allows); nothing is clipped or overlapping; all five navigation links are visible (wrapping allowed, no collapsed menu).
  - (d) Wide screen at 1920×1080: the header's inner content, `main`, and the login and sign-up form areas are each no wider than the theme's maximum content width (named in `docs/design.md`, at most 1600 px), so none spans the viewport edge to edge (a full-width header background is allowed); every body-text block (paragraphs, labels, hints, status and error messages) is at most 80ch wide, measured as rendered width ÷ width of the "0" glyph in its own font.
  - (e) Touch at 375×667 with `hasTouch`, `isMobile` and `hover: none` emulated: the existing successful login and sign-up flows pass using taps only; hovering each interactive element in turn makes no element or text visible that was not visible before. *Inspection*: every `hover:` style in the restyled parts and shared components has a `focus-visible:` (or `focus:`) style giving an equivalent cue on the same element, and no information is conveyed only by a `title` attribute.
  - (f) Text resize (WCAG 1.4.4) at 1280×800 with the root font size set to 200% by script after load (through the CSSOM, so the CSP is unchanged): `/login` and `/signup` have no horizontal page scroll; nothing in the restyled parts is clipped or overlapping; every heading, label, field, button, link, message and all five navigation links visible at 100% are still visible; submitting the empty login form still shows its field errors.
  - (g) Short landscape at 667×375: if the header is fixed or sticky, its height is at most 25% of the viewport height (93.75 CSS px); when tabbing through each page, every focused element is fully inside the viewport and no part of it is covered by a fixed or sticky element; the existing successful login and sign-up flows pass at this viewport using the keyboard only.

## Behavior
- Visual direction (palette, typefaces, layout) is the Builder's decision, made with the `frontend-design` skill from the owner's only direction, "not AI-typical", and the subject. The spec does not prescribe it. The owner approves or rejects it at merge; a rejection loops back to F04 (ADR-005). The Approver checks the criteria, not taste.
- Restyled parts: the shell (page layout, header, main navigation, base typography and background), `/login`, `/signup`, and the shared components. Because the page layout and shared form components are shared, F05 pages (home, students, lessons, summary, pending) pick up the new header, navigation, heading and form-field style; their own content keeps its current styles until F05. This mixed look is accepted (entry Out of scope).
- Hand-written styles used only by restyled parts are removed. CSS modules and the tokens file still used by F05 pages stay; F05 removes them.
- Main navigation keeps the same five links, labels, order and `aria-current` marking. Default chosen: no hamburger or disclosure menu at any width (a menu toggle would add a control and change how links are reached); links wrap instead.
- Default chosen: at most 2 font families, served as WOFF2, with a fallback font stack in the theme so text stays readable if a font file fails to load.
- Default chosen: the existing accessibility e2e checks keep their WCAG 2.1 tags for F05 page content; the 2.2 checks of AC-6 are added as new checks for the restyled parts.
- Responsive scope (AC-6 c–g, owner request): applies to the restyled parts only. On app pages the 320 px, 1920 px, 200% text and landscape checks cover the header and the page layout; F05 page content is checked for these in F05. Defaults chosen: 320×568 for reflow, 1280×800 for text resize, maximum content width at most 1600 px, sticky or fixed header at most 25% of the viewport height at 667×375 (a non-sticky header avoids the limit).
- Known issue: F03 UI-1 ("Next month" wraps below the heading at 375 px) is on the summary page and stays for F05, unless the new shared heading or page layout causes it to get worse.

## Interfaces

### API
None. No endpoint, request or response changes.

### Data model
None.

### Configuration
None. The CSP and other security headers served by the frontend server are unchanged. New frontend dependencies: Tailwind CSS (and its build integration), pinned in the lock file.

## UI
Design reference: `docs/design.md` (produced by this feature).

- **App shell (every app page)**: header with main navigation, current page marked; main landmark with one `h1` focused on mount. States from the session gate (checking session, session check failed with "Try again") use the shared components.
- **`/login`**: default; field errors (`aria-invalid`, messages associated); invalid credentials alert; submitting (button disabled, existing text); server/unreachable error alert; focus order heading → Email → Password → Log in → "Create an account".
- **`/signup`**: default; field errors; duplicate email error on the Email field; submitting; server error alert "Something went wrong. Please try again."; same focus behavior as today.
- No permission state: unchanged (logged-in teachers are redirected away from `/login` and `/signup`; logged-out users are sent to `/login`).

## Security considerations
- No change to who can access what; no new user input, endpoints or data leaving the system.
- CSP stays `default-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'`. No external fonts, styles, scripts or images; no inline `<style>` or `style` attribute in `index.html`.
- New npm dependencies go through the dependency scan in `make check`; only fonts whose license permits self-hosting and redistribution, with the license committed.

## Non-functional
- Accessibility: WCAG 2.2 AA for the restyled parts (owner decision; overrides the plan's 2.1 AA for this feature), including 1.4.3/1.4.11 contrast, 1.4.4 resize text, 1.4.10 reflow, 2.4.7 focus visible, 2.4.11 focus not obscured (minimum), 2.5.8 target size (minimum), and reduced motion respected. Pages not restyled keep passing their existing WCAG 2.1 AA checks.
- Responsive: no horizontal scroll at 375, 768 and 1280 px on every page; for the restyled parts also reflow at 320 px, maximum content width and 80ch lines at 1920 px, touch without hover-only content, 200% text, and 667×375 landscape (AC-6).
- Font payload: at most 2 families (see Behavior).

## Out of scope
- Restyling the content of home, students, lessons, monthly summary and pending payments pages (F05); they may look inconsistent with the new shell until F05 is merged.
- Removing the tokens file or CSS modules still used by pages F05 restyles.
- Any behavior change: routes, copy, validation, error handling, API calls, session handling.
- New pages, a logo or illustration set, dark mode, theme switching.
- Fixing the open non-blocking findings in `pilot-notes.md` (including F03 UI-1), unless a restyled element is the cause.
- A collapsible or hamburger navigation menu.

## Traceability
| Expected result | Criteria |
|---|---|
| Design plan in `docs/design.md` with palette, type, layout, principles, changes vs defaults, subject-driven | AC-1 |
| Tailwind part of the build; theme implements the plan, values defined once and used by name | AC-2 |
| Shared components in the new style, ready for F05 | AC-3 |
| Shell, navigation, login and sign-up use the new identity; their hand-written styles removed | AC-2, AC-3 |
| Fonts from own origin; CSP unchanged; no blocked resources | AC-5 |
| Every page works as before; WCAG AA (2.2 per owner); no horizontal scroll at 375/768/1280 | AC-4, AC-6 (a, b) |
| Owner request: works across devices (320 px reflow, 1920 px wide, touch, 200% text, 667×375 landscape) | AC-6 (c–g) |

## Open questions
None.

## Changelog
- v2: AC-6 split into (a)–(g) and extended with 320 px reflow, 1920 px maximum content width and 80ch lines, touch/hover parity, 200% text resize and 667×375 landscape for the restyled parts; AC-1 adds maximum content width to `docs/design.md`; Behavior, Non-functional and Traceability updated. From owner feedback.
