# Build report: F07 Home overview

- Spec: projects/PRJ-001-lesson-ledger/specs/F07-home-overview.md (version 1)
- Repo: workspaces/.worktrees/lesson-ledger/F07-home-overview
- Branch: feature/F07-home-overview
- Mode: build
- Result: complete

## Criteria
| Criterion | Tests | Status |
|---|---|---|
| AC-1 a, d | frontend/src/features/home/Home.figures.test.tsx (AC-1a, AC-1d, average rounding) | passing |
| AC-1 a, b, c | frontend/e2e/f07-home.spec.ts "F07 AC-1 month figures" (alice and carol, Home vs /summary in one test each) | passing |
| AC-2 a–e | Home.lists.test.tsx (AC-2a–e); f07-home.spec.ts "F07 AC-2 lists" (alice vs /pending and /lessons, carol, exact API reads) | passing |
| AC-3 a | Home.markPaid.test.tsx AC-3a; f07-home.spec.ts AC-3a,b,c | passing (already passed after AC-2, which renders the same list) |
| AC-3 b | Home.markPaid.test.tsx (next row, previous row, empty table focuses h2, refill); f07-home.spec.ts AC-3a,b,c and "table empties" | passing |
| AC-3 c | Home.markPaid.test.tsx AC-3c; f07-home.spec.ts AC-3a,b,c (Home vs /summary Collected/Pending) | passing (the component test already passed through the server refresh; the immediate cache update was added in green) |
| AC-3 d | Home.markPaid.test.tsx (Saving…, 5xx, network, 404); f07-home.spec.ts AC-3d | passing (Saving… already passed via `PaidButton`) |
| AC-4 a–e | Home.quickActions.test.tsx; shared/ui/ActionLink.test.tsx; f07-home.spec.ts "F07 AC-4 quick actions" (position at 1280, colours, no reload, one submit button per form) | passing |
| AC-5 a–e | Home.states.test.tsx (Get started, 1 student, all paid, each of 4 reads × 5xx/network with Try again, loading); f07-home.spec.ts "F07 AC-5" | passing |
| AC-5 c, f | Home.states.test.tsx AC-5c, AC-5f | passing (already existed: c from AC-3, f from F01) |
| AC-6 a | f07-home-checks.spec.ts: F05 AC-6 a–d, f, g per Home state (alice, carol, bob, 1 student, all paid, load error), F05 AC-6e hover per state, touch and keyboard flows through both quick actions and Home's "Mark as paid"; F06 AC-6a contrast and ring of the quick actions; F06 AC-6b/c already cover `/` in f06-shell / f05 checks | passing |
| AC-6 b | f07-home-checks.spec.ts AC-6b (one h1, h2s, status words) | passing |
| AC-6 c | f07-home-checks.spec.ts `expectHomeLayout` (stack order below 1024 px, links below h1, no overlap at 320) | passing |
| AC-6 d | full `make check` and `make e2e` | passing |
| AC-6 e | f07-home-checks.spec.ts AC-6e (CSP header of `/` equals nginx config, unchanged from F06; no `securitypolicyviolation`) | passing |
| AC-6 f | shared/styles/designDocHome.test.ts | passing |

## Checks
| Stage | Command | Result |
|---|---|---|
| Install, lint, typecheck, test, build, scan | `make check` | pass; backend 323 passed (1 skipped), coverage 99%; frontend 411 passed, coverage 99% |
| End-to-end | `make e2e` | pass, 195 passed |

## Changes
- New dependencies: none
- Migrations: none. No backend, OpenAPI, nginx or seed change (`git diff main -- backend frontend/nginx` is empty).
- New code: `features/home/` (HomeOverview, MonthFigures, OldestUnpaid, LatestLessons, GetStarted, QuickActions, api), `shared/ui/ActionLink`, `Page` props `lead` and `actions` (title row), `Section` prop `focusable`, `Button` exports its base classes, `features/payments/pendingRows.ts` (`usePendingRows`, `pendingTotal`, `paidAnnouncement`, now shared by /pending and Home).
- Tests changed rather than added:
  - `features/auth/HomePage.test.tsx`: `openHome` now also answers Home's four reads (empty teacher). Without it, Home's load error added a second `role="alert"` next to the log-out failure alert. Assertions are unchanged.
  - `e2e/f05-pages.spec.ts`: the per-state AC-6 checks and `focusFromTop` were moved unchanged into `e2e/support/pageChecks.ts`, so Home's states run the same definitions. Assertions are unchanged.
  - `src/test/ledger.ts`: added `homeRoutes`. `src/test/home.ts` holds the Home fixtures.
- Screenshots: `docs/design/f07-home-{alice,bob}-{375,1280}.png`, from this feature's production build (`make up`) with seed data of the same day.

## Open issues
- **Merge gate:** the orchestrator must show the owner the 4 screenshots and ask "Do you approve the look and content of Home?".
- **Design decisions within the spec:**
  - The two lists stack at every width, never side by side: two five-column tables don't fit at 1280 px without scrolling.
  - The figures are in a box styled like the metrics panel, sized to its figures from `md`. Each value sits above its term, like the reference's Overview; the DOM order stays term then value.
  - "Get started" uses the same box.
  - All of this is recorded in `docs/design.md`.
- **Screenshots section of `docs/design.md`:** the F07 Home files are listed as bullets under the F06 table, not in a second table. The F06 test parser merges every table line in the section and requires exactly 7 rows. The F06 `/` row now shows Home before F07, and the doc says so.
- **AC-1 terms:** the terms are written without colons ("Collected"), as AC-1(a) lists them. `/summary` keeps its colons ("Collected:"). The e2e test compares values by term.
