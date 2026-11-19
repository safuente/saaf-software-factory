# Build report: F08 Icons, brand and motion

- Spec: projects/PRJ-001-lesson-ledger/specs/F08-icons-brand-and-motion.md (version 1)
- Repo: workspaces/.worktrees/lesson-ledger/F08-icons-brand-and-motion
- Branch: feature/F08-icons-brand-and-motion
- Mode: build
- Result: complete

## Criteria
| Criterion | Tests | Status |
|---|---|---|
| AC-1 (a)-(f) icons | `frontend/src/shared/ui/icons.test.tsx` (sidebar links, current vs other link, Log out incl. logging out, log-out alert, shared alert, none on Try again / text links / status / h1); `frontend/src/features/icons.test.tsx` (Mark as paid / Undo paid on /summary with Saving… and back, /pending, Home quick actions and Mark as paid, Add student with Adding… and back, Record lesson; no icons in table cells or form fields); `frontend/e2e/f08-icons.spec.ts` (audit of every page as alice, names exact, never focusable, icon = text colour and >= 3:1 in normal/hover/focus, Log out disabled, log-in alert, Saving… on a test teacher) | passing |
| AC-2 (a)-(d) brand | `frontend/src/shared/ui/brand.test.tsx` (brand first in header, plain text, landmarks; none on public pages; favicon link; no style/script/data:/other origin; favicon shapes equal the inline mark, colours equal theme token values); `frontend/e2e/f08-brand.spec.ts` (1280 sidebar on 5 pages, 375/768 top bar, Tab order unchanged, /login and /signup without brand, `/favicon.svg` 200 `image/svg+xml` with the security headers of `/`) | passing |
| AC-3 (a)-(c) illustrations | `frontend/src/features/illustrations.test.tsx` (5 states: one illustration right before the unchanged message, outside tables, hidden, theme colour names only; none on Home in-section messages, "Add a student before…", loading, load error, lists with items); `frontend/e2e/f08-illustrations.spec.ts` (bob on 5 pages, alice `/summary?month=2000-01`, none on alice's pages) | passing |
| AC-4 (a)-(e) motion | `frontend/src/shared/styles/motion.test.ts` (duration/easing tokens and limits, all motion behind `prefers-reduced-motion: no-preference`, token-only timings, colour-only transitions, keyframes once, highlight contrast, components use only `motion-*` utilities, no JS animation); `frontend/src/features/motion.test.tsx` (which elements carry which utility; highlight on /summary success only, once per success, not on undo/failure//pending/Home; bar and figures keep their elements after a mark); `frontend/e2e/f08-motion.spec.ts` (computed transitions 150-200 ms colours only; grow and fades, iteration 1, <= 1000 ms; highlight frozen at its strongest colour with row text >= 4.5:1, border and ring >= 3:1; no replay after mark/undo; iteration counts all 1, longest <= 1000 ms) | passing |
| AC-5 (a)-(c) reduced motion | `frontend/e2e/f08-motion.spec.ts` (same elements under `reduce`: longest <= 0.01 ms, bar at 41%, opacity 1, highlighted row's background equals the others', no animations); `motion.test.ts` (Playwright default `reducedMotion: "reduce"`, only `f08-motion.spec.ts` overrides it); existing F04/F05/F07 per-state motion checks; `f08-motion.spec.ts` passed `--repeat-each=10` (30/30) | passing |
| AC-6 (a) regressions and devices | existing F05/F06/F07 specs (unchanged) plus `frontend/e2e/f08-checks.spec.ts` (F05 AC-6 `checkPageState` on the 6 illustrated states; icons/logo/wordmark/illustrations not clipped, not outside the viewport, not over text at 320/375/768/1280 and 200% text, for signed out, alice and bob) | passing (already held when written) |
| AC-6 (b) | `make check`, `make e2e`; only pre-existing test changed is `theme.test.ts` (see Changes) | passing |
| AC-6 (c) CSP, pin, scan | `f08-checks.spec.ts` (CSP byte-identical to F07's on 7 pages and the favicon, no `securitypolicyviolation`, with and without reduced motion); `designDocF08.test.ts` (exact pin, lock entry, ISC); `make check` scan | passing |
| AC-6 (d) docs and notes | `designDocF08.test.ts`, `theme.test.ts` (Icons and Motion tables defined in the theme with their values), `motion.test.ts` (no "no motion" comment) | passing |
| AC-6 (e) screenshots | `designDocF08.test.ts` (18 F08 files listed and present) | passing |

## Checks
| Stage | Command | Result |
|---|---|---|
| Install | `make check` (install) | pass |
| Lint, format, OpenAPI, types | `make check` (lint, typecheck) | pass |
| Tests | `make check` (test) | pass: backend 323 passed, 1 skipped, coverage 99%; frontend 462 passed, coverage 99% |
| Build | `make check` (build) | pass |
| Scan | `make check` (scan: bandit, pip-audit, npm audit) | pass |
| E2E | `make e2e` | pass, 227 passed |
| Motion determinism | `npx playwright test e2e/f08-motion.spec.ts --repeat-each=10` | pass, 30/30 |

## Changes
- New dependencies: `lucide-react` 1.76.0 (exact pin, ISC), the icon set ADR-007 names; lock file committed.
- Migrations: none. Backend, API, OpenAPI and seed unchanged.
- New frontend parts: `shared/ui/Icon.tsx` (icon map), `shared/ui/Brand.tsx` (logo mark + wordmark), `shared/ui/Illustration.tsx` (5 drawings), `public/favicon.svg`; `icon` and `motion-interaction|grow|fade|highlight` utilities, `@keyframes grow-in|fade-in|paid-highlight`, tokens `--icon-size`, `--duration-*`, `--ease-*`, `--color-paid-wash` (#EEFAF1) in `app.css`. `Button`/`ActionLink` take an `icon` prop, `Totals` a `fadeIn` prop, `TableRow` `highlighted`/`onHighlightEnd`.
- Playwright: `use.reducedMotion: "reduce"` suite-wide (AC-5 c).
- Tests changed rather than added: `frontend/src/shared/styles/theme.test.ts` — adds the "Icons" and "Motion" tables to the doc-vs-theme check and `ease` to the cleared namespaces (stricter, ADR-007 rules). No assertion removed or weakened.
- Own new tests adjusted between red and green (in the feat commits, explained in their messages): escaped `*` in the theme-name pattern, Tailwind-motion-class pattern requires a suffix (a form field is named "duration"), jsdom needs React's prefixed `animationend`, CSS transitions excluded from "new animations", Tab-order check starts from a loaded page, mark by keyboard so the focus ring shows, icon map moved to its own doc section.
- Docs: `docs/design.md` (Direction note, Layout, Alerts, new Icons, Icon map, Brand, Illustrations, Motion sections, `paid-wash` palette row, Product logo adopted / Customer photos left out, F08 screenshots list); `CLAUDE.md` (ADR-007 rules replace "no motion"); `useWholeColumns.ts` comment no longer says the design has no motion.
- Screenshots: 18 files `docs/design/f08-*.png`, production build, reduced motion, full page, current month.

## Design notes
- Logo mark: original — a white rounded tile with three ruled ledger lines (`outline`), a note on the middle line (`graphite`) whose flag is drawn as a tick (`paid`): lessons recorded and paid. Wordmark in `heading` size, semibold, `shell-text`.
- Illustrations reuse that line language (ruled pages, notes, the tick) in greys, `paid` green only on the "every lesson is paid" drawing; 80 px (`size-20`).
- Highlight colour `paid-wash` is light because the focus ring must stay >= 3:1 on it (`focus` 3.03:1, `outline` 3.12:1, `paid` 4.67:1); the green wash is subtle by necessity.
- Motion is CSS only and lives in utilities wrapped in `@media (prefers-reduced-motion: no-preference)`, so nothing needs a global reduced-motion override.

## Open issues
- AC-6 (a) checks passed when first written (the icons, logo and illustrations already met them); recorded as tests that guard the behaviour rather than red-first.
- Live try-out of the highlight as alice changes her data (marks one of her unpaid current-month lessons); `make seed` resets the seed accounts, so re-run it after the gate if needed.
- Merge gate (ADR-006/ADR-007): owner approval of the 18 screenshots and the live motion is pending; the stack was stopped with `make down` per instructions.
