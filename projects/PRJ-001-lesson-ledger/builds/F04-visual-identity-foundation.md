# Build report: F04 Visual identity and Tailwind foundation

- Spec: projects/PRJ-001-lesson-ledger/specs/F04-visual-identity-foundation.md (version 2)
- Repo: workspaces/.worktrees/lesson-ledger/F04-visual-identity-foundation
- Branch: feature/F04-visual-identity-foundation (10 commits on `main` 4195438; no remote, base unchanged, no rebase needed)
- Mode: build
- Result: complete

## Visual direction (for the owner at merge)
Subject: an independent music teacher's ledger. Direction: manuscript paper and the music stand, not an accountant's office.
- Cool, faintly green manuscript `paper` background, blue-black `ink`, `verdigris` (patina of old brass instruments) for everything you act on, `brass` focus ring, `correction` red-pen errors.
- The single ornament is a five-line stave under the navigation (and on top of login/sign-up). Each nav link has a note head: filled brass for the current page, open for the others.
- Buttons are piano keys: square top, rounded bottom, deeper bottom edge. Invalid fields get a thick red bar on the left, so errors are marked by shape as well as colour.
- Type: Alegreya 500 for headings, Alegreya Sans 400/700 for everything else (one OFL superfamily, self-hosted, 3 WOFF2 files, about 72 KB). Bringhurst scale 16/18/24/36/48 px.
- No cards, shadows, gradients, all-caps eyebrows, hamburger menu or motion.
- The full plan, contrast ratios and the "Changed versus generic defaults" list are in `docs/design.md`.

Screenshots at 375 and 1280 px are in `docs/design/` (repo): `login-*`, `login-errors-*`, `signup-*`, `shell-home-*`, `shell-lessons-*`. As the spec allows, the F05 pages still have their old blue buttons and content styles under the new header.

## Criteria
| Criterion | Tests | Status |
|---|---|---|
| AC-1 | frontend/src/shared/styles/designDoc.test.ts (7 tests: sections, palette rows with name/value/role/contrast, typefaces with license and self-hosting, token tables, content width ≤ 1600 px, subject rationale, ≥ 5 "Generic default / Instead" items) | passing |
| AC-2 | frontend/src/shared/styles/theme.test.ts: `AC-2a` exact-pinned Tailwind and plugin in lock file, Vite plugin on app.css, no CDN or other origin; `AC-2b` every docs/design.md name defined once in `@theme` with its value, Tailwind defaults cleared; `AC-2c` restyled files have no CSS module or tokens import, no `style`, no literal colour, px or `[...]` class; `AC-2d` custom CSS only in shared/styles and only theme variables, old App.module.css and global.css gone | passing |
| AC-3 | frontend/src/shared/ui/{Button,TextField,SelectField,Table,StatusMessage,Alert,LoadError,Page,MainNav,Form}.test.tsx; composition.test.ts (every component has a test; login, sign-up and session gate render no HTML element or className of their own) | passing (TextField, SelectField, StatusMessage, LoadError, MainNav and most Page tests passed on first run because those components already existed) |
| AC-4 | `make check` and `make e2e` (all 35 pre-existing e2e and every pre-existing unit test pass); `git diff main --name-status` shows no pre-existing test file modified | passing |
| AC-5 | frontend/e2e/f04-fonts-csp.spec.ts: CSP header byte-identical on all 7 pages, no `securitypolicyviolation`, no failed request or 5xx, every font request from APP_URL origin, `document.fonts` has each family from docs/design.md `loaded`; WOFF2 files with `OFL.txt` per family | passing |
| AC-6 a | f04-restyled-parts.spec.ts `AC-6a` (axe with wcag2a/2aa/21aa/22aa on login and sign-up in default, field-error and server-error states and on the header of every app page; 24×24 or spacing exception; tab-through focus indicator and not covered; reduced motion ≤ 0.01 ms incl. pseudo-elements) | passing |
| AC-6 b | `AC-6b` 375/768/1280: no horizontal scroll on all 7 pages; five nav links visible, not overlapping, no menu button | passing |
| AC-6 c | `AC-6c` 320×568: login and sign-up states have no horizontal scroll, no element outside 0–320, no clipping or overlap; app header and page heading inside 0–320, five links visible | passing |
| AC-6 d | `AC-6d` 1920×1080: header content, `main` and forms ≤ `--container-content` (1152 px); body-text blocks ≤ 80 "0" glyphs | passing |
| AC-6 e | `AC-6e` 375×667 touch: `(hover: none)` and `(pointer: coarse)` confirmed; login and sign-up by tap; hovering each control changes nothing visible. Inspection automated in composition.test.ts: every `hover:` class has a `focus-visible:`/`focus:` twin, no `title` attribute | passing |
| AC-6 f | `AC-6f` 1280×800 with root font size 200% set through the CSSOM: no horizontal scroll, no clipping or overlap, every control visible before is still visible, empty login submit shows both field errors; app header keeps the five links | passing |
| AC-6 g | `AC-6g` 667×375: header is not fixed or sticky (rule checked anyway); every tab stop fully in view and not covered; keyboard-only login and sign-up | passing |

The AC-6 checks were written after the restyle of AC-2/AC-3 and passed on first run. To make sure they can fail, I tried a non-wrapping navigation and a `transition-colors` class on purpose: 4 checks failed (6b, 6c, 6f and the reduced-motion check).

## Checks
| Stage | Command | Result |
|---|---|---|
| Install, lint, typecheck | `make check` | pass |
| Tests | `make check` | backend 323 passed, 1 skipped, coverage 99%; frontend 281 passed, coverage 98% |
| Build, scan | `make check` | pass |
| E2E | `make e2e` | 66 passed (35 existing + 31 new) |

## Changes
- New dependencies (dev, exact-pinned): `tailwindcss` 4.3.5 (the CSS framework from ADR-005), `@tailwindcss/vite` 4.3.5 (its build integration).
- Fonts: Alegreya 500 and Alegreya Sans 400/700 (latin, WOFF2), copied from the Fontsource packages 5.3.0 with their `OFL.txt` into `frontend/src/shared/styles/fonts/`. They are not installed as npm dependencies.
- Migrations: none.
- Removed: `src/app/App.module.css` (unused), `src/shared/styles/global.css` (replaced by `app.css`), and every `ui.module.css` rule used only by restyled parts. `ui.module.css` and `tokens.css` stay for the F05 pages, with a comment saying F05 removes them.
- Tests changed rather than added: none of the pre-existing tests. Two of my own new tests were fixed after their red commit: `composition.test.ts` matched type arguments such as `useState<string>` as JSX (narrowed to real JSX elements), and the app-pages test in `f04-fonts-csp.spec.ts` counted a request that the previous navigation aborted (now one fresh tab per page). `layout.ts` allows 0.5 px when checking that a focused element is fully in view, because scrolling lands on whole pixels while text boxes end on fractions.
- Repo `CLAUDE.md`: frontend conventions updated for Tailwind, the shared components and the legacy CSS.

## Open issues
- Preflight is on, so the F05 pages lose browser-default paragraph margins and list markers. Paragraphs without a class (`p:not([class])`) and lists get them back in the base layer. Other small differences on F05 content are covered by the mixed look the spec accepts: body text is now 18 px Alegreya Sans, and `h2` uses the display font.
- Tailwind's default font-weight names (`font-normal/medium/bold`) are kept, not cleared. `docs/design.md` says so; weights are not a namespace the spec lists.
- `docs/design.md` is outside `frontend/`, so `make lint` does not run Prettier on it. Prettier would reformat its tables, but the content is correct.
- `make seed`: no change needed. The login and sign-up states use the existing seed teacher (`alice@example.com`) or route stubs.
- Commit order: AC-2 and AC-3 share one feat commit (9495c1c). The AC-2 checks (no CSS module in shared components) could only pass once the shared components existed. Both test commits came before it.
