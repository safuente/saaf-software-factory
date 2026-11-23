# Build report: F06 Dashboard redesign of every page and the app shell

- Spec: projects/PRJ-001-lesson-ledger/specs/F06-dashboard-redesign.md (version 1)
- Repo: workspaces/.worktrees/lesson-ledger/F06-dashboard-redesign
- Branch: feature/F06-dashboard-redesign
- Mode: build
- Result: complete

## Criteria
| Criterion | Tests | Status |
|---|---|---|
| AC-1 a | src/shared/styles/designDoc.test.ts (`AC-1a` sections, palette, typeface, token tables with rendered px, breakpoints, layout, components with theme names only, reference elements adopted / left out with WCAG 2.2 AA); theme.test.ts (`AC-2b` every doc name defined once in the theme with its value, nothing else) | passing |
| AC-1 b | designDoc.test.ts `AC-1b` (16 px root, table of 7 elements); e2e/f06-identity.spec.ts `AC-1b` (stated sizes equal computed sizes on /login, / and /lessons at 1280×800) | passing |
| AC-1 c | theme.test.ts `AC-1c` (app source, app.css, index.html; every font file referenced by the theme, one family, Alegreya dirs gone); designDoc.test.ts `AC-1c`; f06-identity.spec.ts `AC-1c` (served HTML, JS and CSS of the production build) | passing |
| AC-1 d | designDoc.test.ts `AC-1d` (14 listed files exist under docs/design/) | passing |
| AC-2 a, c, e | src/features/auth/ShellLogOut.test.tsx `AC-2a`, `AC-2a,e`, `AC-2c`; e2e/f06-shell.spec.ts `AC-2a,c,e` (1280 px geometry, colours, Log out at the sidebar bottom, h1 family and title step) | passing (a/e class-level and c already held after the AC-1 restyle) |
| AC-2 b | f06-shell.spec.ts `AC-2b,c` at 320, 375, 768, 1000 px | passing |
| AC-2 d | src/shared/ui/MainNav.test.tsx `F06 AC-2d`; f06-shell.spec.ts `AC-2d` (weight and pill at 1280 and 375) | passing |
| AC-2 f | ShellLogOut.test.tsx `AC-2f` (DELETE once, disabled, /login, alert first in main, cache cleared, on each app page); HomePage.test.tsx (F01 tests); f06-shell.spec.ts `AC-2f` (held request on /pending, alert at top of main, then success) | passing |
| AC-2 g | Page.test.tsx; f06-shell.spec.ts `AC-2g` | passing |
| AC-2 h | Button.test.tsx `F06 AC-2h`; f06-shell.spec.ts `AC-2h` (computed colours of Add student, Previous/Next month, Log out, Mark as paid) | passing |
| AC-3 a | e2e/f05-tables.spec.ts `AC-3a` (captions, headers, order; single 1 px rule on every cell, no right border, border-spacing 0); f06-tables.spec.ts `AC-3a` (grey header text) | passing |
| AC-3 b | src/shared/format.test.ts `F06 AC-3b initials`; StudentName.test.tsx; src/features/studentCells.test.tsx `AC-3b`; f06-tables.spec.ts `AC-3b` (::before shows initials, `ariaSnapshot` of each cell is exactly the name) | passing |
| AC-3 c | studentCells.test.tsx `AC-3c`; f06-tables.spec.ts `AC-3c` (tick, colour, contrast ≥ 4.5:1, accessible text exactly Paid/Unpaid) | passing |
| AC-3 d | studentCells.test.tsx `AC-3d`; f06-tables.spec.ts `AC-3d` | passing (see Open issues: grey label) |
| AC-3 e | f05-tables.spec.ts `AC-3d`, `AC-3e` (unchanged F05 tests) | passing |
| AC-4 a | src/features/payments/MetricsPanel.test.tsx `AC-4a`; e2e/f06-summary.spec.ts `AC-4a,b,g`; F03 disabling tests unchanged | passing |
| AC-4 b | MetricsPanel.test.tsx `AC-4b` and metrics unit tests; f06-summary.spec.ts (panel right of the table, bar paid segment 41% ±1 pp) | passing |
| AC-4 c | MetricsPanel.test.tsx `AC-4c`; f06-summary.spec.ts `AC-4c` | passing |
| AC-4 d | MetricsPanel.test.tsx `AC-4d`; f06-summary.spec.ts `AC-4d` | passing |
| AC-4 e | f06-summary.spec.ts `AC-4e` at 1279, 1024, 768, 375 px | passing |
| AC-4 f | MetricsPanel.test.tsx `AC-4f` (loading, error); f06-summary.spec.ts `AC-4f` | passing |
| AC-4 g | MetricsPanel.test.tsx `AC-4g`; f06-summary.spec.ts `AC-4a,b,g` (request set of the page load) | passing |
| AC-5 a | `make check`, `make e2e` | passing |
| AC-5 b, c | all pre-existing unit and e2e tests (see "Tests changed rather than added") | passing |
| AC-5 d | e2e/f04-fonts-csp.spec.ts (unchanged: byte-identical CSP on the 7 pages, no violation, own-origin fonts, the `docs/design.md` family `loaded`) | passing |
| AC-6 (F05 a–g) | e2e/f05-pages.spec.ts (all app-page states), e2e/f04-restyled-parts.spec.ts (/login, /signup states), f06-shell.spec.ts `AC-6 /login and /signup … at 375, 768 and 1280 px` (clip/overlap, which F04 did not check) | passing; the auth-page widths test passed on first run |
| AC-6 a | f06-shell.spec.ts `AC-6a` (shell text ≥ 4.5:1, ring ≥ 3:1 on the dark ground and on white) | passing |
| AC-6 b | f06-shell.spec.ts `AC-6b` at 320×568, 667×375 and 1280×800 with 200% root text (Shift+Tab reach, in viewport, not clipped, tap each link and Log out) | passing |
| AC-6 c | f05-pages.spec.ts (d), f04-restyled-parts.spec.ts AC-6d | passing |
| AC-6 d | f06-summary.spec.ts `AC-6d` | passing |

## Checks
| Stage | Command | Result |
|---|---|---|
| Install | `make install` (in `make check`) | pass |
| Lint | `make lint` (ruff, ESLint, Prettier, OpenAPI contract, mypy, tsc) | pass |
| Tests | `make test` | pass: backend 323 passed, 1 skipped, coverage 99%; frontend 368 passed, coverage 99% |
| Build | `make check` build stage | pass |
| Scan | `make check` scan stage | pass |
| E2E | `make e2e` | pass, 158 passed |

## Changes
- New dependencies: none. Font file Inter (variable WOFF2, latin subset, about 48 KB) and its OFL licence copied from the Fontsource package 5.3.0 into `frontend/src/shared/styles/fonts/inter/`. It is not an npm dependency. Alegreya and Alegreya Sans were deleted.
- Migrations: none.
- Design: `docs/design.md` rewritten for ADR-006. Root 16 px, Inter, 17 palette names (6 core), with rendered px for every token. 14 screenshots are in `docs/design/f06-*.png`. The F04/F05 screenshots were removed.
- Shell: `Page` with `nav` renders a `header` (the dark sidebar from 1024 px, a top bar below it, never fixed or sticky) with the "Main" nav and "Log out". Log out uses `LogOutProvider` (F01 mutation, moved out of HomePage) through `ShellContext`, wrapped around app pages by `RequireSession`. A failed log out shows its alert as the first element of `main`.
- Initials and tick: CSS generated content with empty alternative text (`content: attr(data-initials) / ""`, `content: "\2713" / ""`, custom utilities in app.css). This keeps the text and accessible name of each cell exactly the name, "Paid" or "Unpaid" (AC-3 b, c), and every existing text-based test unchanged.
- Bar: inline SVG `rect` width attributes, so no `style` attribute is needed under the CSP.
- Two table bugs found by the existing e2e checks once the Student column got wider, both fixed test-first in `useWholeColumns`:
  - Chrome left a row button partly outside its region after Tab (AC-6 g, UI-2). The focused control is now scrolled into its region.
  - Stretched columns that rounded 1 px past the region toggled `table-room` forever, so Playwright saw the element as "not stable".
- Latent F05 bug fixed: `border-spacing-0` was glued to a template expression (`border-spacing-0${…}`), so Tailwind never generated it. Tables had 2 px gaps between cells since F05.
- `CLAUDE.md` updated for the shell, Log out, theme names, the Inter font and the whole-class-name rule. `README.md` needed no change. Seed unchanged.
- Tests changed rather than added:
  - `HomePage.test.tsx` "logs out by keyboard" and `e2e/ac3-logout.spec.ts`: one **Shift+Tab** from the focused h1 reaches Log out instead of one Tab, because the spec moves Log out into the shell, before `main` in DOM and visual order. The assertions are unchanged.
  - `e2e/f04-restyled-parts.spec.ts`: the header tab order is now `NAV_LINKS` + "Log out", and the 667×375 header stop count is now 6. Same reason (AC-2 a).
  - `shared/ui/composition.test.ts`: HomePage renders only `Page`. `Page.tsx` renders `Button`, `Alert` and `MainNav`. SummaryPage renders `MetricsPanel`, which renders `Totals`. MetricsPanel is added to the shared-only check.
  - Identity tests replaced (AC-5 b):
    - `designDoc.test.ts` and `theme.test.ts` table names: old plan contents.
    - `e2e/f05-rendered-sizes.spec.ts` deleted (18/54/1296/504 px) and replaced by `f06-identity.spec.ts`.
    - `f05-pages.spec.ts` 200% root: 32 instead of 36 px, because the root is now 16 px.
    - `f05-tables.spec.ts` double rule replaced by the single 1 px rule.
    - `Button.test.tsx` (verdigris, white key), `Page.test.tsx` (stave), `PaymentStatus.test.tsx` (ink/pencil) and `Table.test.tsx` (`bg-paper` → `bg-canvas`).
  - My own tests fixed after their red commit:
    - `ShellLogOut.test.tsx` waits for the nav, because the session gate's loading page has the same h1.
    - The failed-log-out case moved from /lessons to /pending, whose fake API answers every request.
    - `f05-tables` border-spacing accepts Chrome's `0px` shorthand.

## Open issues
- **Merge gate (ADR-006)**: the owner must see the 14 screenshots in `docs/design/` and answer "Do you approve the look?" before merge. This is outside the Approver's check.
- **AC-3 d "grey headers or labels"**: the students list has no column header. Adding one ("Name") would be new visible text, which AC-5 c forbids. The list keeps its "Your students" `h2` as its label, in the normal heading colour, and gets the table's thin dividers and initials. If the owner wants a grey header row, the spec needs to allow the copy.
- **Log out placement at ≥ 1024 px**: it sits at the bottom of the first viewport height of the sidebar. The sidebar is not sticky, so on long pages (carol's 500 rows) it stays at the bottom-left of the first screen, not at the bottom of the page.
- **Log out is a secondary button on the dark sidebar**: white fill, dark text, outline (AC-2 h, Behavior "the other buttons use the secondary style").
- **"Try again" is now secondary**: it was primary in F04/F05, and the spec reserves primary for form submits.
- **The tick "✓"** is outside Inter's latin subset, so it renders in the system fallback font. It is decorative.
- Commit `8d9e184` (AC-2 feat) was made while `make lint` reported non-null assertions in the new shell e2e. They were fixed in the next commit (`84b5b39`).

## Fix round 1

- Mode: fix
- Input: `builds/F06-dashboard-redesign.checks.md` (round 1, commit `ad9a09f`): `make e2e` failed at `e2e/f05-pages.spec.ts:237` "AC-6 a-d, f, g /summary default (alice)", BUTTON "Mark as paid" not `inViewportWhereItFits` after Tab at 667 x 375.
- Result: complete

### Cause

Timing, not layout. The failure did not reproduce in a single run here, but did with `--repeat-each=20 --workers=8` (3 of 4 batches). Instrumented runs showed, at the failing stop, the summary region 603 px wide with columns 659 px wide, `scrollLeft` 0 and the button at x 553-679 in a 667 px viewport. In most failures `table-room` was also missing. `useWholeColumns` attached its `focusin` handler (the one that scrolls a focused control fully into the region, added in `5ad9305`) only in an effect gated on the measured `overflowing` state. Just before step (g), the test resizes the viewport from 1920 px (no overflow) to 667 px. Under load, the ResizeObserver callback, the re-render and the effect can finish after Tab has already reached the row buttons, so no handler runs. Chrome does not scroll the region by itself, so the button stays partly outside the viewport.

### Fix

The `focusin` handler now has its own effect, which depends only on the region and does not wait for the overflow measure. `scrollIntoView({ block: "nearest", inline: "nearest" })` does nothing to a control that is already in view. Settling on whole columns and `table-room` still depend on the measured overflow, so their behavior has not changed. The test assertion has not changed.

## Findings
| Finding | Action | Commit |
|---|---|---|
| e2e f05-pages.spec.ts:237 /summary default (alice): "Mark as paid" not in view after Tab at 667 x 375 | fixed: unit test reproduces Tab landing before the overflow is measured; `focusin` handler no longer gated on `overflowing` | `7293ece` (test), `89f5d66` (fix) |

### Tests
- Added: `frontend/src/shared/ui/useWholeColumns.test.tsx` "F06 AC-6g a control focused before the observer reports the overflow is still scrolled into the region" (red before the fix for the expected reason: `scrollIntoView` not called).
- Changed rather than added: none.

### Checks
| Stage | Command | Result |
|---|---|---|
| Lint, typecheck | `make lint` | pass |
| Check | `make check` | pass; backend 323 passed, 1 skipped, frontend 369 passed, coverage 99% |
| Failing spec under load | `playwright test e2e/f05-pages.spec.ts -g "summary default" --repeat-each=20 --workers=8`, 5 times | 200/200 passed (before the fix: failures in 3 of 4 batches) |
| E2E | `make e2e`, twice | 158 passed each time |

### Changes
- New dependencies: none
- Migrations: none
- Rebase: not needed. `main` (`bce572d`) is already an ancestor of the branch, and the repo has no remote.

### Open issues
- No look change, so the screenshots do not need new approval.

## Fix round 2

- Mode: fix (Approver rejection, `reviews/F06-dashboard-redesign/approval.md` round 2: APR-1, APR-2; optional UI-1, CODE-2)
- Result: complete
- Head: `84158b5`

### APR-1: Log out at the bottom of the full sidebar
The inner header column was `lg:min-h-screen`, so `mt-auto` stopped at the first viewport height. At `lg` the `header` is now a flex column (`lg:flex lg:flex-col`) and its inner column is `lg:flex-1`. The header already stretches to the shell row, which is at least the viewport tall (`lg:min-h-screen` on the row), so Log out sits at the sidebar's real bottom. No fixed or sticky positioning. On alice's `/lessons` at 1280×800 the header is 1308 px tall and Log out ends 32 px (the `py-8` padding) above its bottom.

### APR-2: grey label on the students list
`Section` takes an optional `label` flag that renders its `h2` in `slate` (6.15:1 on `canvas`), the colour of table header text. `StudentsPage` sets it on "Your students", which labels the list (`aria-labelledby`). Text, level, size and id are unchanged, and no copy was added.

### Findings
| Finding | Action | Commit |
|---|---|---|
| APR-1 Log out not at the sidebar's bottom on pages taller than the viewport | fixed. The e2e test now compares Log out with the `header`'s bottom on every app page, and a new test uses alice's `/lessons` (header > 900 px) | `72ed326` (test), `fccd708` (fix) |
| APR-2 students list has no grey header or label (CODE-1) | fixed: "Your students" in `slate`. Unit and e2e assertions added | `6701c05` (test), `57be7bc` (fix) |
| APR-1/APR-2 docs | `docs/design.md` updated. Layout: "bottom of the sidebar, which grows with `main`". Students list: label in `slate` | `a8a5d0c` |
| APR-1/APR-2 screenshots | all 14 retaken from the production build (alice, current month, full page, 375/1280 px, clean `make seed`). Only `lessons-375/1280` and `students-375/1280` changed. The other 10 are byte-identical | `84158b5` |
| CODE-2 stale comment in `Table.tsx` | refactored (re-wrapped) | `a7352b1` |
| UI-1 names wrap at 375 px | declined: not small and safe. Measured at 375 px: the Student column is 113 px and all names wrap. Shrinking the circle to size `6` with gap `1` narrows the column to 101 px, and every name still wraps, because the column sizes to the longest word. Only `white-space: nowrap` below `sm` stops the wrap, but it widens the pinned column to 159 px (42% of the screen) and changes the AC-6 table-scroll layout. That is a look decision for the owner, not a small fix | — |

### Tests
- Added: `e2e/f06-shell.spec.ts` "AC-2a at 1280 px on a page taller than the viewport: Log out at the bottom of the full sidebar…". `e2e/f06-tables.spec.ts` "AC-3d /students: the list's label "Your students" is grey like the table headers". `src/features/studentCells.test.tsx` "AC-3d the list's label … is grey (slate)…". All three failed for the expected reason before the fix: Log out was 539.6 px above the header's bottom, the label was `rgb(29, 33, 39)`, and the heading had no `text-slate`.
- Changed rather than added:
  - `e2e/f06-shell.spec.ts` "AC-2a,c,e at 1280 px": the Log out check moved from the viewport's bottom (`800 - bottom <= 64`) to the header's bottom, as APR-1 asks. This makes the check stronger.
  - `src/features/auth/ShellLogOut.test.tsx` "AC-2a,e": the assertion on the old class (`lg:min-h-screen` on the inner column) now checks the new structure: `lg:min-h-screen` on the shell row, `lg:flex-col` on the header and `lg:flex-1` on the inner column. The behaviour checked is the same.

### Checks
| Stage | Command | Result |
|---|---|---|
| Targeted | `make test T=frontend/src/features/studentCells.test.tsx`, `make e2e T=e2e/f06-shell.spec.ts`, `make e2e T=e2e/f06-tables.spec.ts` | pass (6, 13, 5) |
| Lint, typecheck | `make lint` | pass |
| Check | `make check` | pass. Backend 323 passed, 1 skipped. Frontend 370 passed. Coverage 99% |
| E2E | `make e2e` | 160 passed |

### Changes
- New dependencies: none
- Migrations: none
- Rebase: not needed. `main` is an ancestor of the branch, and the repo has no remote.

### Open issues
- **Look gate (ADR-006)**: 4 screenshots changed (`f06-lessons-*`, `f06-students-*`). The owner should review all 14 in `docs/design/`, including the grey "Your students" heading. If the owner does not want a grey section heading, the alternative is the spec change the Approver named for APR-2.
- UI-1 (wrapped names on phones) is left for the owner to decide at the look gate (see Findings).
