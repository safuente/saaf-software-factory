# Build report: F05 Restyle the remaining pages

- Spec: projects/PRJ-001-lesson-ledger/specs/F05-restyle-remaining-pages.md (version 1)
- Repo: workspaces/.worktrees/lesson-ledger/F05-restyle-remaining-pages
- Branch: feature/F05-restyle-remaining-pages
- Mode: build
- Result: complete

## Criteria
| Criterion | Tests | Status |
|---|---|---|
| AC-1 a | src/shared/styles/designDoc.test.ts: `F05 AC-1a states the 18 px root…`, `…every rem step … lists its px at the 18 px root`, `…breakpoints as 640, 768 and 1024 px` | passing |
| AC-1 b | e2e/f05-rendered-sizes.spec.ts: `AC-1b /login at 1280 x 800 renders the approved F04 sizes` (root 18, h1 54, label 18, input 20.25, main max 1296, form 504) | passing (already held; guard test) |
| AC-1 c | designDoc.test.ts: `F05 AC-1c describes table, totals list, month navigation, payment status and pending total with theme names only` | passing |
| AC-1 d | designDoc.test.ts: `F05 AC-1d lists Home, Students, … at 375 and 1280 px, and the files exist` | passing |
| AC-2 a | src/shared/styles/theme.test.ts: `F05 AC-2a no CSS module or tokens file exists or is imported`, `AC-2d custom CSS lives in the shared styles area…` (now: app.css is the only stylesheet) | passing |
| AC-2 b | theme.test.ts: `AC-2c … no literal colour, pixel size or arbitrary value` and `AC-2c … no CSS module … no style attribute` (scope widened to every non-test source file), `F05 AC-2b no source file under src uses a style attribute` | passing |
| AC-2 c | src/shared/ui/composition.test.ts: `F05 AC-2c buttons, fields, tables, status messages, alerts and load errors come from shared/ui`, `F05 AC-2c each page imports the shared components it renders`; hover-parity tests extended to the F05 pages | passing |
| AC-2 d | theme.test.ts: `F05 AC-2d the design-doc parser sits with the test support code; no app module imports it` | passing |
| AC-3 a | e2e/f05-tables.spec.ts: `AC-3a /lessons|/summary|/pending: shared table, caption, columns in order, double rule, money right-aligned`; Table.test.tsx `F05 AC-3a the region is focusable and named by the caption` | passing |
| AC-3 b | f05-tables.spec.ts `AC-3b …Paid or Unpaid in every row`; PaymentStatus.test.tsx | passing |
| AC-3 c | f05-tables.spec.ts `AC-3c summary totals stay a description list…`; Totals.test.tsx | passing |
| AC-3 d | f05-tables.spec.ts `AC-3d at 320|375 px the Student cell stays in view after scrolling a table fully right`; Table.test.tsx `F05 AC-3d pins the first column…` | passing |
| AC-3 e | f05-tables.spec.ts `AC-3e at 1280|1920 px a table is at most as wide as main` | passing |
| AC-4 | full `make e2e` (118 tests) and unit suite green; accessibility.spec.ts and f03-payments.spec.ts axe tags now include `wcag22aa` | passing |
| AC-5 | e2e/f04-fonts-csp.spec.ts (already covered /login, /signup and all five app pages; docstring now names F05 AC-5) | already existed, passing |
| AC-6 a–d, f, g | e2e/f05-pages.spec.ts `AC-6 a-d, f, g <page> <state> (<account>)`: 19 states (alice default ×5, bob empty ×4, carol many ×4, field errors ×2, load errors ×4); `AC-6f at 200% text the empty Add a student form still shows its field error` | passing |
| AC-6 e | f05-pages.spec.ts `AC-6e hovering reveals nothing: …` (19 states), `AC-6e … taps only` flow; inspection automated in composition.test.ts hover parity / no-title tests | passing |
| AC-6 g flows | f05-pages.spec.ts `AC-6g the flows of AC-6e with the keyboard only` | passing |

## Checks
| Stage | Command | Result |
|---|---|---|
| Install, lint, typecheck, test, build, scan | `make check` | pass; backend 323 passed (1 skipped), coverage 99%; frontend 298 passed, coverage 98% |
| E2E | `make e2e` | pass, 118 passed (see Open issues for one pre-existing flake) |

## Changes
- New dependencies: none.
- Migrations: none.
- Theme: one addition, spacing `0` (`--spacing-0: 0`), needed because the theme clears Tailwind's spacing scale, so `left-0` and `border-spacing-0` generated nothing. Documented in `docs/design.md` Spacing. Palette, typefaces, type scale and rem values unchanged.
- New shared components (each with a unit test): `Section`, `Totals`, `PaymentStatus`; `Button` gained `variant="secondary"` (the white key); `Table` now renders the focusable region named by its caption and `TableCell` has `nowrap` and `pinned`.
- Removed: `shared/ui/ui.module.css`, `shared/styles/tokens.css`. Moved: `shared/styles/designDocParser.ts` to `src/test/designDoc.ts`.
- `docs/design.md`: Rendered column on type scale, spacing, radii and widths; new "Rendered sizes" and "Page patterns" sections; two more "changed versus generic defaults" items; F05 screenshots (`docs/design/{home,students,lessons,summary,pending}-{375,1280}.png`), F04 screenshots kept.
- Tests changed rather than added:
  - theme.test.ts: `RESTYLED` widened from the F04 files to every non-test source file; the legacy-CSS exemption replaced by "app.css is the only stylesheet"; parser import path. Stricter, nothing removed.
  - composition.test.ts: hover-parity and title checks extended to the F05 pages.
  - accessibility.spec.ts, f03-payments.spec.ts: `wcag22aa` added to the axe tags (allowed by AC-4).
  - e2e/support/layout.ts: overlap check leaves out elements inside a table's scroll region (spec AC-6 terms); a sticky cell inside the focused element does not count as covering it; `wideTextBlocks` also measures `li` and `dl`; new `inViewportWhereItFits` field (see Open issues). F04 tests behave the same, since their pages have no tables or sticky cells.
  - e2e/support/stack.ts: `seed()` retries up to 4 times. Parallel spec files serialize on the seed's advisory lock, and one run hit its statement timeout.
  - Table.test.tsx (my own new F05 test, fixed after its red commit): the pinned cell is passed `pinned` explicitly instead of being inferred.
  - f05-pages.spec.ts (my own, fixed after its red commit): exact label for the Student select, and the flow waits for the summary heading before reading the month.

## Open issues
- **AC-6 g with a table taller than the viewport.** At 667×375 alice's `/summary` table region is 385 px tall, so no element of that size can be "fully inside the viewport". The check accepts it when it fills the viewport on that axis (top ≤ 0 and bottom ≥ viewport height), which is how Chrome scrolls an oversized focused element. Every element that fits must be fully in view. The Approver should confirm this reading, or ask for a vertically limited region instead (that would mean nested scrolling on phones, which I chose not to build).
- **AC-6 a "covered" for the focused table region.** The pinned Student cells are inside the region, so they are treated as part of it, not as covering it. The region's brass ring lies outside its box and is never under a sticky cell.
- **Pre-existing F03 race (not changed, outside scope).** `f03-payments.spec.ts` "AC-2 AC-3 … mark and undo on the summary" failed once in five full e2e runs. The announcement read "Marked as unpaid. Collected: $1,394.00, pending: $0.00." where "$1,349.00 … $45.00" was expected. Likely cause: `PaidButton`'s `onSuccess` reads the latest `lesson` prop, and when the lessons refetch from the previous click arrives before the undo response, `previous.paid === updated.paid` and the delta is 0. This is a behavior bug from F03 that F05 is not allowed to change. It should go to the backlog.
- Design decisions taken without the owner (recorded in `docs/design.md` "Page patterns"):
  - The filled verdigris key is kept for submitting a form or retrying a load.
  - Repeated actions (mark/undo, month steps, log out) use the new white-key secondary button. Its sides are spacing 2 below `sm` so "Previous month" and "Next month" share a row at 320 px.
  - "Unpaid" is bold ink and "Paid" is pencil.
  - The pinned Student column is ruled off by a stave bar line.
- `make e2e` takes about 1.5 minutes. f05-pages.spec.ts alone takes about 1.7 minutes of worker time because of carol's 500-row states (axe and hover on every button).

---

# Fix round 1: `make e2e` flaky under host load

- Mode: fix
- Findings: projects/PRJ-001-lesson-ledger/builds/F05-restyle-remaining-pages.checks.md (round 1, commit 2cdb01d)
- Result: complete. One known F03 race remains (see Open issues).

## Findings
| Finding | Action | Commit |
|---|---|---|
| Spec files reseeded alice/bob/carol in parallel workers (13 `beforeAll(seed)`); every reseed rehashes three Argon2id passwords and rewrites carol's 1,030 rows in the shared backend container, under one advisory lock. | fixed: the seed runs once in a Playwright `globalSetup` (`e2e/support/global-setup.ts`) before any worker starts. The per-file `seed()` calls are removed, along with the 4-attempt retry in `seed()`. The seed accounts are read-only to every spec. I checked this: the only writes under seed accounts are routed or field-error flows that persist nothing. | 17b02c7 |
| `ac1-signup.spec.ts` deleted and recreated `carol@example.com` (`beforeEach`/`afterAll`), while `f05-pages.spec.ts` reads the seeded carol for its many-items states. | fixed: ac1 uses its own `uniqueEmail()` teacher. The case-and-whitespace normalization is still exercised (`" <LOCAL-UPPER>@Example.com "` → lowercase, `<LOCAL-UPPER>@example.com` → 409). Every assertion is unchanged. | 17b02c7 |
| 5 s timeouts waiting for "Signed in as …" after sign-up and log-in (alice, bob, unique teachers). | fixed: `workers: 4` and `expect.timeout: 10_000` in `playwright.config.ts`. Justification: the Docker VM that runs every project's stacks has 4 CPUs (`docker info`), and each sign-up or log-in runs Argon2id (64 MiB, 4 lanes). Measured with curl: one log-in takes 0.11 s, and 9 concurrent log-ins take 0.9–1.0 s each. The host load average during the runs was 8–32 (other projects, other Chrome instances). With the seed fix alone at the default 9 workers, two runs still failed (7 and 3 failures, all sign-up or log-in waits). At 4 workers with a 5 s expect, one run passed at load 24–32. The 10 s expect adds margin for the same waits and changes no assertion. Total run time is about 3.2 min, up from about 3.0 min at 9 workers under the same load. | f1eaf0c |

## Checks
| Stage | Command | Result |
|---|---|---|
| Lint, typecheck | `make lint` | pass |
| E2E run 1 | `make e2e` | pass, 118 passed (3.3m), load avg before 18.5 |
| E2E run 2 | `make e2e` | fail, 117 passed, 1 failed: f03-payments "AC-2 AC-3 … mark and undo on the summary". This is the F03 `PaidButton` race, not a timeout (see Open issues). Load avg 11.2. |
| E2E run 3 | `make e2e` | pass, 118 passed (3.0m), load avg 11.4 |
| E2E run 4 | `make e2e` | pass, 118 passed (3.2m), load avg 11.7 |
| E2E run 5 | `make e2e` | pass, 118 passed (3.3m), load avg 8.2 |

`make check` was not rerun: it passed on 2cdb01d, and this round changes only `frontend/e2e/**` and `frontend/playwright.config.ts`, which lint and typecheck cover (both pass). The unit suites do not load them.

## Changes
- New dependencies: none. Migrations: none. Production code: none.
- Tests changed rather than added: `ac1-signup.spec.ts` (own teacher instead of carol, assertions unchanged), and 9 spec files that lost their `beforeAll(seed)`. No assertion removed or weakened.

## Open issues
- **F03 `PaidButton` totals race (not fixed, out of scope).** It failed in 1 of 5 runs, with the same symptom as in the build round: the announcement read "Marked as unpaid. Collected: $1,394.00, pending: $0.00." where "$1,349.00 … $45.00" was expected. The values are wrong, so the 10 s wait does not help: the test ran out its 30 s. This is a behavior bug in F03 production code, not test flakiness. Until it is fixed in its own backlog item, `make e2e` can fail on this one test about 1 run in 5. Every other failure from the checks file did not recur in 5 runs.

# Fix round 2: UX-2, UI-2, CODE-2

- Spec: projects/PRJ-001-lesson-ledger/specs/F05-restyle-remaining-pages.md (version 1)
- Repo: workspaces/.worktrees/lesson-ledger/F05-restyle-remaining-pages
- Branch: feature/F05-restyle-remaining-pages
- Mode: fix
- Findings: reviews/F05-restyle-remaining-pages/ux-reviewer.md (UX-2), ui-reviewer.md (UI-2), code-reviewer.md (CODE-2)
- Result: complete

## Owner decisions (2026-11-18)
- The owner accepts the builder's reading of AC-6 g: an element taller than the viewport is in view if it fills the viewport on that axis.
- The owner accepts the builder's reading of AC-6 a: sticky Student cells inside a focused table region do not count as covering it.
- UX-2, UI-2 and CODE-2 are to be fixed, test first for each. For CODE-2 the owner explicitly authorises a change to F03 behaviour, as an exception to F05's "no behavior change" rule. The f03-payments e2e assertions stay unchanged.
- UX-1 and UI-1 stay as they are.

## Findings
| Finding | Action | Commit |
|---|---|---|
| CODE-2: F03 mark/undo totals race. `PaidButton` re-read the `lesson` prop when the PATCH returned, and in-flight list and total reads from an earlier change could land mid-request. | fixed. New test `features/payments/PaidRace.test.tsx` reproduces the race deterministically. It holds the refetch from "Mark as paid", clicks "Undo paid", then lets the held reads land before the undo response, one answered before the undo and one after it, in both orders. Red: it announced "Collected: $144.00, pending: $0.00" (the e2e symptom) and "$54.00 / $90.00". Fix: the mutation carries the lesson as clicked, and `onSaved(updated, clicked)` moves totals by the request's own change. In-flight lesson, summary and pending reads are cancelled when a mark/undo starts and again when it succeeds (`cancelPaymentReads`). `invalidatePayments` now runs in `PaidButton`'s `onSettled`, only when no other mark/undo is pending, so no read is in flight while a request is. Pages no longer call it. | eeec248, 3a7d648 (tests), 0291922 (fix), afb1f82 (CLAUDE.md) |
| UX-2: when a table scrolled sideways, the pinned Student column partly covered the next column ("$45.00" read as "45.00") and the caption scrolled out of the region. | fixed. New e2e test `f05-tables.spec.ts` "UX-2 at 320/375 px". It scrolls each scrolling table to 6 positions and focuses the first 3 Action buttons. At rest it checks that no column is partly under the Student column, the caption text lies inside the region's visible box, and the focused control sits fully between the pinned column and the right edge. Red: "Date partly under the Student column", "caption cut". Fix: new `shared/ui/useWholeColumns.ts`. When scrolling ends (`scrollend`, or a 150 ms pause where that event is missing), the region moves instantly (no motion) to the nearest position where a column starts at the pinned edge, preferring positions that keep a focused control fully in view. While the columns overflow, the table gets `table-room`, a custom utility in `app.css` that sets `padding-inline-end: var(--container-form)`. That room lets the last columns reach the pinned edge, since at the natural end the visible area starts mid-column (measured at 375 px on /summary: it starts at 340 px, inside Price at 291–364 px). The caption text is a `sticky left-0` span. `docs/design.md` "Pinned Student column" describes this. | 6cfe06c (test), f55ef43 (fix) |
| UI-2: the focus ring was clipped when a control was scrolled flush to the viewport edge. | fixed. `tabThrough` now also reports `ringInViewport`: the box plus outline width and offset lies inside the viewport, for elements that fit in it. New test `f05-pages.spec.ts` "UI-2" covers all 5 app pages at 320×568 and 667×375 as alice. Red on 7 of 10 (Mark as paid, Previous/Next month, Undo paid, Log out, form fields). Fix: `scroll-m-2` (spacing 2, 9 px, larger than the 3 px ring plus 2 px gap) on `a[href]`, buttons, fields and `[tabindex]`. Table regions are excluded, because with a margin a region taller than the viewport no longer fills it (the AC-6 g check failed on /pending at 667×375). `docs/design.md` spacing 2 lists the use. | cb3e538 (test), 3d76aee (fix) |
| UX-1, UI-1 | left as they are, per the owner | none |

## Checks (final commit 3d76aee)
| Stage | Command | Result |
|---|---|---|
| Local CI | `make check` | pass. Install, lint, typecheck ok. Backend 323 passed, 1 skipped, coverage 99%. Frontend 300 passed, coverage 90%. Build and scan ok. |
| E2E run 1 | `make e2e` | pass, 130 passed (1.5m) |
| E2E run 2 | `make e2e` | pass, 130 passed (1.5m) |
| E2E run 3 | `make e2e` | pass, 130 passed (1.6m) |

## Changes
- New dependencies: none. Migrations: none.
- Production: `features/payments/{PaidButton.tsx, api.ts, SummaryPage.tsx, PendingPage.tsx}`, `shared/ui/Table.tsx`, new `shared/ui/useWholeColumns.ts`, `shared/styles/app.css` (`table-room` utility and focusable scroll margin; no theme token changed), `docs/design.md`, `CLAUDE.md`.
- Tests changed rather than added: `e2e/support/layout.ts` `tabThrough` gains the `ringInViewport` field. No existing assertion was changed. The f03-payments e2e and the existing MarkPaid unit assertions are unchanged.

## Open issues
- Behaviour change in F03 (owner-authorised): a list or total refresh after mark/undo now waits until the last pending mark/undo on the page has settled, and it also runs after a failed request.
- `useWholeColumns` measures layout in the browser, so it has no jsdom unit test. It is covered by the UX-2 and AC-3d e2e tests in Chromium only. Safari without `scrollend` uses the 150 ms pause fallback, which is untested here.
- `table-room` uses `padding-inline-end: var(--container-form)`, a theme variable in custom CSS (allowed by AC-2b). The room is reachable only transiently: when scrolling ends, the region returns to at most one column past the table's natural end.

# Fix round 4: CODE-3, UI-3

- Spec: projects/PRJ-001-lesson-ledger/specs/F05-restyle-remaining-pages.md (version 1)
- Repo: workspaces/.worktrees/lesson-ledger/F05-restyle-remaining-pages
- Branch: feature/F05-restyle-remaining-pages
- Mode: fix (owner-authorised 4th round, limited to CODE-3 and UI-3)
- Findings: reviews/F05-restyle-remaining-pages/code-reviewer.md (CODE-3, blocking), ui-reviewer.md (UI-3, suggestion)
- Result: complete. UI-3 is not verified in a browser (see Open issues)

## Findings
| Finding | Action | Commit |
|---|---|---|
| CODE-3: `useWholeColumns.ts` at 19% coverage, frontend total 98% to 90%. | Fixed with tests only. Added `frontend/src/shared/ui/useWholeColumns.test.tsx` with 21 tests. They render `Table` in jsdom with a stubbed `ResizeObserver` and stubbed geometry: region `clientWidth`/`scrollLeft`/`scrollTo`/box, header `offsetLeft`/`offsetWidth`/box, focused button box. They cover: observing region and table; `table-room` added on overflow and removed when the columns fit; exact fit does not overflow; no-op without ResizeObserver; nearest column start from 4 positions; no scroll at rest or within 0.5 px; no scroll while not overflowing, or when the region grew before re-measuring; a column starting under the pinned column is skipped; a focused control is kept whole even past a nearer start; fallback to nearest when no position shows it whole; focus on the region or outside it is ignored; Safari path with `onscrollend` removed and fake timers (settles exactly 150 ms after the last `scroll`, ignores `scrollend`, cancels a pending settle on unmount); disconnect and listener removal on unmount; listener removal once the columns fit. All pass against the existing hook, so no bug was found and production code is unchanged. Mutation check: changing the 150 ms delay, the focus rule, the negative-position skip, `disconnect` or `clearTimeout` each fails at least one test. Coverage: hook 100% lines, 90.7% branches; frontend total 98.57% lines (was 90.17%), 90.56% branches (was 82.39%). | bdee6bf |
| UI-3: table region focus ring cut at the bottom at 375x667. | Fixed, with a deviation from the suggestion. Test: the UI-2 e2e walk now also runs at 375x667 on all 5 pages. Fix: table regions get `scroll-mb-2` (spacing 2, bottom only) and controls keep `scroll-m-2`. I did not use the full `scroll-m-2` on regions because round 2 showed it fails AC-6 g on /pending at 667x375. Tabbing forward to a region taller than the viewport makes Chrome align the top edge of its margin box, so the region stops 9 px below the viewport top and does not fill it. With a bottom-only margin, a short region reached by Tab is aligned by its bottom edge with 9 px below it, which is the UI-3 case. A tall region is still aligned by its top edge at 0. | 3ba7140 (test), 738b029 (fix) |

## Checks
| Stage | Command | Result |
|---|---|---|
| Lint, typecheck | `make lint` | pass |
| Frontend unit, with coverage | `npx vitest run --coverage` (frontend) | pass, 321 tests, 98.57% lines |
| Build CSS | `vite build` | region rule emits `scroll-margin-bottom: var(--spacing-2)` |
| Backend tests, `make check`, `make e2e` | not run | the stack is down and starting it was not permitted; the orchestrator runs them next |

## Changes
- New dependencies: none. Migrations: none.
- Production: `frontend/src/shared/styles/app.css` only (new region scroll-margin rule).
- Tests changed rather than added: `e2e/f05-pages.spec.ts` UI-2 walk gains the 375x667 viewport; no assertion changed.

## Open issues
- UI-3 is unverified in a browser. I could not run `make e2e`, so the new 375x667 cases were never seen red or green, and AC-6 g was not re-run. The orchestrator's `make e2e` decides, and the cases to watch are "UI-2 * at 375 x 667" and the AC-6 g walks at 667x375. One known limit: Shift+Tab back up to a short region aligns its top edge, so the top ring can still be cut. That was already the case before this change, and no test walks backwards through regions.
