---
feature: F04
project: PRJ-001
round: 1
decision: approved
route_to: human-merge
reviewed: feature/F04-visual-identity-foundation @ 791df5a65a809a141aacf9877d9bea7b548f8c27
spec_version: 2
---

# Approval: F04 Visual identity and Tailwind foundation

## Round 1

### Preconditions
| Check | Result |
|---|---|
| Security review | pass @ 791df5a (round 1, 0 blocking) |
| Code review | pass @ 791df5a (round 1, 0 blocking, 1 suggestion) |
| UX review | pass @ 791df5a (round 1, 0 blocking) |
| UI review | pass @ 791df5a (round 1, 0 blocking) |
| Spec | `status: approved`, v2; build report cites v2 |
| Checks (`make check`, `make e2e`) | pass @ 791df5a (head of branch): backend 323 passed / 1 skipped, frontend 281 passed, e2e 66 passed |
| Branch | merge-base with `main` = `main` head 4195438 (no rebase needed) |

### Acceptance criteria
Independent checks ran against the production build at `http://localhost:3102` with Playwright (Chromium) and `@axe-core/playwright` from the repo's own `node_modules`, scripts outside the repo. Seed account `alice@example.com` was used for browsing only; accounts created: `apr-f04-<ts>@example.com`, `apr-f04t-<ts>@example.com`.

| Criterion | Tests | Independent check | Result |
|---|---|---|---|
| AC-1 | `designDoc.test.ts` (7 `AC-1 ...` tests: sections, palette rows, typefaces, token tables, width ≤ 1600, rationale, ≥ 5 changes) | Read `docs/design.md`: all required sections present; 10 colours each with theme name, value, role, contrast; recomputed every ratio from the hex values (WCAG relative luminance) and all 22 figures match (e.g. ink/paper 14.74, stave/paper 3.94, brass/paper 4.56, correction/wash 6.20); 2 families with weights, OFL 1.1, self-hosted; rationale tied to independent music teachers' ledger; 9 "Generic default / Instead" items | pass |
| AC-2 | `theme.test.ts` `AC-2a` (exact pin in lock file, Vite plugin, no CDN), `AC-2b` (every design name defined once with its value, defaults cleared), `AC-2c` (no module/tokens import, no `style`, no hex/px/`[...]`/colour fn tokens), `AC-2d` | `package.json` and lock pin `tailwindcss` and `@tailwindcss/vite` 4.3.5; `vite.config.ts` uses the plugin; served HTML loads only `/assets/*`; `@theme` in `app.css` defines all 10 colours, 2 fonts, 5 text steps, 8 spacing steps, 3 radii, 3 breakpoints, 3 containers, with every namespace reset to `initial`; read all restyled files: no CSS module, no `style`, no arbitrary or literal-colour classes; only CSS is `shared/styles/app.css` (+ legacy `tokens.css` kept for F05 per Behavior) | pass |
| AC-3 | `{Button,TextField,SelectField,Table,StatusMessage,Alert,LoadError,Page,MainNav,Form}.test.tsx`; `composition.test.ts` (each component has a test; login, sign-up and session gate render no element of their own); `Table.test.tsx` checks `th scope="col"` and `td:nth-child` selection | Read the components and pages: Login/Signup/SessionGate compose only `Page`, `Form`, `Note`, `TextLink`, `TextField`, `Alert`, `Button`, `LoadError`, `StatusMessage`; `Table` renders native `table` with `th scope="col"` | pass |
| AC-4 | `make check`, `make e2e` pass @ 791df5a; `git diff --name-status main..HEAD` shows only added test files, no pre-existing test modified | Source diff of auth pages, SessionGate, Page, MainNav, LoadError, StatusMessage, fields: only markup/class changes; copy, routes, `noValidate`, `aria-invalid`/`aria-describedby`, `role=alert/status`, h1 focus unchanged. Live: h1 "Log in" focused on load; empty submit → "Enter your email." / "Enter your password.", `aria-describedby="email-hint email-error"`; unknown `apr-nobody-*` login → alert "Email or password is incorrect.", password cleared; sign-up as alice → "An account with this email already exists." on Email, focus on `#email`; titles "Lessons · Lesson Ledger" etc.; `aria-current` on the matching nav link on all 5 pages | pass |
| AC-5 | `f04-fonts-csp.spec.ts` (`/login`, `/signup`, 5 app pages; license files) | All 7 pages: CSP header byte-identical to `default-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'`; 0 `securitypolicyviolation`; 0 failed requests; all font requests from `http://localhost:3102/assets/`; `document.fonts`: Alegreya/500, Alegreya Sans/400, Alegreya Sans/700 all `loaded`; `OFL.txt` committed in both font directories | pass |
| AC-6a | `f04-restyled-parts.spec.ts` `AC-6a` (6 public states, app header on 5 pages, reduced motion) | axe (wcag2a/2aa/21aa/22aa): 0 violations on 6 login/sign-up states and on header of 5 app pages (also 0 on the full app pages); tab stops all `outline: solid 3px rgb(140,106,28)`; smallest target "Log in" link 41×28; reduced motion: longest transition/animation 0 ms incl. pseudo-elements | pass |
| AC-6b | `AC-6b` | 375/768/1280 on 7 pages: `scrollWidth == innerWidth`; five links visible, non-overlapping boxes, 0 buttons in nav/header | pass |
| AC-6c | `AC-6c` (6 states + app header) | 320×568, 6 login/sign-up states: no scroll, nothing outside 0–320, 0 clipped, 0 overlaps; app pages: header links wrap onto 3 rows, all inside 18–296 px | pass |
| AC-6d | `AC-6d` | 1920×1080: `main` and header inner div 1296 px (= `--container-content` 72rem at the 18 px root, ≤ 1600), forms 504 px; widest text block 56ch | pass (see note 1) |
| AC-6e | `AC-6e` ×3; `composition.test.ts` hover/focus twins and no `title` | 375×667 touch: `(hover: none)` true; hovering every control on `/login`, `/signup` and each control of the header on 5 app pages changes nothing visible; sign-up and login of a new `apr-` account by taps only succeed; read hover classes: `hover:enabled:bg-verdigris-deep`/`focus-visible:enabled:…`, `hover:underline`/`focus-visible:underline`, `hover:decoration-2`/`focus-visible:decoration-2`; no `title` | pass |
| AC-6f | `AC-6f` ×3 | 1280×800, root set to 200% via CSSOM: `/login`, `/signup` no scroll, 0 clipped, 0 overlaps, no visible element lost, empty login submit shows both errors. Also repeated at 36 px root (true 2× the rendered 18 px default): same result. Screenshot `login-text-36px.png` | pass (see note 1) |
| AC-6g | `AC-6g` ×3 | 667×375: header `position: static` (169 px, limit does not apply); every tab stop on login and on the header of 5 app pages fully in viewport, nothing fixed/sticky; keyboard-only invalid login, keyboard-only sign-up of `apr-f04-*` lands on `/` | pass |

Behavior and Security rules spot-checked: no hamburger at any width (0 buttons in nav from 320 to 1920); at most 2 families, WOFF2, fallback stacks in `--font-display`/`--font-body`; CSP and `index.html` unchanged (no `style`, no inline `<style>`); F03 UI-1 ("Next month" wraps at 375 on `/summary`) is unchanged, not worse.

### Definition of done
| Item | Result |
|---|---|
| Every criterion has tests referencing its id | pass (AC-1 to AC-6g all have `AC-N` tests) |
| CI stages pass locally | pass @ 791df5a |
| Branch rebased on base | pass (merge-base = `main` head) |
| Migrations included and reversible | not applicable |
| `make seed` reaches every UI state | pass (login/sign-up states from seed and README; server error via README's backend stop) |
| README updated if setup changed | not applicable (no new command or config; repo `CLAUDE.md` updated for Tailwind) |
| No TODOs without a backlog item | pass (no TODO/FIXME added) |

### Notes (non-blocking, for the owner at merge)
1. **Rendered sizes are 12.5% larger than `docs/design.md` states.** `html` gets `text-body` (1.125rem), so the root is 18 px and every rem token scales by 1.125: `main` max 1296 px (doc says 1152 px), form 504 px (doc: 448), h1 54 px / 40.5 px (doc: 48 / 36), inputs and buttons 20.25 px while labels are 18 px (doc: all 18 px). No criterion fails (names and rem values match, width ≤ 1600), but the doc's px annotations do not describe the screens the owner will judge, and F05 builds on them. Either fix the doc's px figures or move the 18 px body size off the root before F05. A side effect: the AC-6f "root 200%" check means 32 px, about 178% of the rendered default; I re-ran it at 36 px and it passes.
2. Border and outline widths use Tailwind bare-number utilities (`border-b-4`, `border-l-4`, `outline-3`, `decoration-2`). Tailwind 4 has no theme namespace for these, and they are not arbitrary `[...]` values, so I did not count them as literal pixel sizes under AC-2c.

### Decision
Approved, route to human merge. Every acceptance criterion is covered by tests as written and confirmed against the running build. The Definition of done is met. The visual direction and note 1 are for the owner to decide at merge.

## Pull request description

## F04: Visual identity and Tailwind foundation

Lesson Ledger gets a defined visual identity, written down in `docs/design.md` and implemented as a Tailwind CSS 4 theme. The direction is manuscript paper and the music stand. The app shell (header and main navigation), `/login` and `/signup` are rebuilt from new shared components in this style, with no behavior change. The F05 pages pick up the new header, heading and form fields. Their own content keeps the old styles until F05.

Spec: projects/PRJ-001-lesson-ledger/specs/F04-visual-identity-foundation.md (v2)

### Acceptance criteria
| Criterion | Verified by |
|---|---|
| AC-1 `docs/design.md` with palette, contrast, type, spacing, radii, widths, principles, rationale, changes vs defaults | `designDoc.test.ts`, independent check (contrast ratios recomputed) |
| AC-2 Tailwind pinned and built; theme defines every design name once; restyled parts use names only | `theme.test.ts` (AC-2a–d), independent check |
| AC-3 Shared button, fields, table, status, alert, load error, page, nav; login/sign-up/shell built from them | `shared/ui/*.test.tsx`, `composition.test.ts`, independent check |
| AC-4 Checks pass; no pre-existing test changed; copy, routes, a11y wiring unchanged | `make check`, `make e2e`, diff of tests and pages, independent check |
| AC-5 Fonts from own origin, CSP byte-identical, no violations or failed requests, fonts loaded, OFL committed | `f04-fonts-csp.spec.ts`, independent check |
| AC-6a WCAG 2.2 AA axe, target size, focus visible and unobscured, reduced motion | `f04-restyled-parts.spec.ts` AC-6a, independent check |
| AC-6b No horizontal scroll at 375/768/1280, five links visible, no menu | AC-6b, independent check |
| AC-6c Reflow at 320×568 | AC-6c, independent check |
| AC-6d Max content width and ≤ 80ch at 1920×1080 | AC-6d, independent check |
| AC-6e Touch: taps-only flows, hover reveals nothing, hover/focus parity | AC-6e, `composition.test.ts`, independent check |
| AC-6f 200% text | AC-6f, independent check (also at 36 px root) |
| AC-6g 667×375 landscape, keyboard-only flows | AC-6g, independent check |

### Reviews
Security: pass · Code: pass · UX: pass · UI: pass · Rounds: 1

### Notes for the reviewer
- New dev dependencies, exact-pinned: `tailwindcss` 4.3.5 and `@tailwindcss/vite` 4.3.5. Run `npm ci` (or `make check`) after merging.
- Self-hosted fonts (Alegreya 500, Alegreya Sans 400/700, latin WOFF2, about 72 KB) with `OFL.txt` under `frontend/src/shared/styles/fonts/`. They are copied from Fontsource 5.3.0, not installed as packages.
- Removed `src/app/App.module.css` and `src/shared/styles/global.css`. `ui.module.css` and `tokens.css` stay for the F05 pages.
- Tailwind Preflight is on. Unstyled paragraphs and lists on F05 pages get their margins and markers back in the base layer. The mixed look on F05 pages is expected until F05 merges.
- Rendered sizes are 1.125× the px figures in `docs/design.md` because the root font size is 18 px (content max 1296 px, h1 54 px). Fix the doc or the root size before F05.
- No migrations, API, configuration or CSP changes.
- Owner decision at merge: approve or reject the visual direction (ADR-005). Screenshots are in `docs/design/`.
