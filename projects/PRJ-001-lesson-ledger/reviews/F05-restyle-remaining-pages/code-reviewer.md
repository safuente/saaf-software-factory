---
feature: F05
project: PRJ-001
reviewer: code
round: 4
verdict: pass
blocking: 0
suggestions: 0
reviewed: feature/F05-restyle-remaining-pages @ 738b029bdd3f7fbb5d3028c0208dfc522994339b
---

# Code review: F05 Restyle the remaining pages

## Round 2

Full review of the diff against main (first review of the feature; round 1 was the failed checks run). Checks file: commit equals head, result pass (make check and make e2e).

### Previous findings
None.

### AC-4 audit of edited existing tests
- `ac1-signup.spec.ts`: carol replaced by `uniqueEmail()`; every assertion kept. Case and whitespace normalization is still exercised (`" LOCAL@Example.com "` then `LOCAL@example.com` for the 409). Domain is `example.com` so the expected email equals `TEACHER`.
- `ac2/ac3/ac4/accessibility/f02/f04-*` specs: only the `seed` import and `beforeAll(seed)` removed; seeding moved to `globalSetup` (`e2e/support/global-setup.ts`). Seed accounts are no longer mutated by any spec (grep: no `forgetTeacher` on alice/bob/carol).
- `accessibility.spec.ts`, `f03-payments.spec.ts`: `wcag22aa` added to axe tags (allowed).
- `playwright.config.ts`: `workers: 4`, `expect.timeout: 10_000`. Longer waits, no assertion changed.
- `support/layout.ts`: changes are additive or scoped to F05 pages (table-region cells excluded from overlap, per spec terms; `li`/`dl` added to the 80ch check, which is stricter; sticky cell inside a focused region not "covering"). `inViewportWhereItFits` is a new field used only by `f05-pages.spec.ts`; F04 tests still assert `inViewport`.
- Unit tests: `theme.test.ts` is widened (every non-test source file, app.css the only stylesheet), parser import path only otherwise; `composition.test.ts`, `designDoc.test.ts`, `Button/Table.test.tsx` only gain tests. No pre-existing feature unit test touched.

No assertion removed or weakened.

### TDD and traceability
Each criterion has a `test(F05): AC-N` commit before its `feat(F05): AC-N` commit (AC-2, AC-3, AC-6, AC-1; AC-4/AC-5 are test-only). Test commits contain only test files, test support and `playwright.config.ts`. All six criteria appear in test names.

### Findings

#### CODE-1: AC-6 g "fully inside the viewport" is relaxed for oversized elements
- **Severity**: suggestion
- **Category**: tests
- **Location**: `frontend/e2e/support/layout.ts` (`inViewportWhereItFits`), `frontend/e2e/f05-pages.spec.ts:290`
- **Criterion**: AC-6
- **Problem**: At 667x375 alice's `/summary` table region is 385 px tall, so it cannot be fully in view. The check accepts a focused element that fills the viewport on that axis. This is a reasoned reading, disclosed in the build report, but it is a reading of the spec, not the spec.
- **Evidence**: Build report, Open issues, first bullet; helper diff. Elements that fit must still be fully in view.
- **Suggestion**: The Approver confirms the reading. No code change needed from me.

#### CODE-2: F03 mark/undo totals race makes `make e2e` fail about 1 run in 5 (pre-existing)
- **Status (round 3)**: resolved, see Round 3.
- **Severity**: suggestion
- **Category**: correctness
- **Location**: `frontend/src/features/payments/PaidButton.tsx` (`onSuccess` reads the current `lesson` prop); test `f03-payments.spec.ts` "mark and undo on the summary"
- **Criterion**: none
- **Problem**: If the lessons refetch from the first click lands before the undo response, the delta is 0 and the announcement shows wrong totals. Pre-existing F03 behavior, not changed by F05 and out of its scope (build report, both rounds).
- **Evidence**: Build report: failed 1 of 5 runs with "Collected: $1,394.00, pending: $0.00". The checks file run passed.
- **Suggestion**: Put it on the backlog as its own item; compute the delta from the request's target state rather than the prop.

### Summary (round 2)
The restyle is a clean composition change: pages use shared components, ui.module.css and tokens.css are gone, the parser is out of the production tree, no behavior or copy changed, and the edited existing tests keep every assertion. No blocking findings; two suggestions (the AC-6 g reading for the Approver, and the pre-existing F03 race to backlog).

## Round 3

Reviewed `f1eaf0c..3d76aee`. Checks file: commit equals head, result pass (make check, make e2e 130 passed).

### Previous findings
- CODE-1: unchanged, owner accepted the reading. Closed.
- CODE-2: resolved (owner-authorised behaviour change). Review of the logic in `PaidButton.tsx` and `payments/api.ts`:
  - The mutation carries the lesson as clicked, so `onSaved(updated, clicked)` computes the delta from the request, not the prop. This removes the delta-0 case.
  - `onMutate` and `onSuccess` both await `cancelPaymentReads` (revert default, so cancelled reads restore the previous cache). Reads started between click and response are dropped before the cache write.
  - `onSettled` invalidates only when `isMutating({mutationKey}) === 1`. In TanStack Query v5 the settling mutation is still pending in `onSettled`, so 1 means last one; with two rows pending, the later settle refreshes. The error path (incl. 404) also refreshes. Pages no longer invalidate; the `index < 0` branch in `PendingPage` loses its own invalidate but `onSettled` covers it.
  - Callbacks are on the mutation options, so they still run when the row unmounts after success.
  - `PaidRace.test.tsx` holds reads, covers both read orders, asserts the announcement and the totals. `f03-payments` assertions are unchanged (the diff touches no existing test).
- AC-4: no existing assertion weakened in this round. Changes to existing files are `layout.ts` (additive `ringInViewport`) and docs.

### TDD
Order is correct for each fix: CODE-2 `eeec248`, `3a7d648` then `0291922`; UX-2 `6cfe06c` then `f55ef43`; UI-2 `cb3e538` then `3d76aee`. Test commits contain only test files. `3a7d648` rewrites the test added in `eeec248` in the same round; it is not a pre-existing test, so not a weakening.

### New findings

#### CODE-3: coverage fell from 98% to 90%; new code is below the Definition of done
- **Severity**: blocking
- **Category**: tests
- **Location**: `frontend/src/shared/ui/useWholeColumns.ts` (112 lines, new in `f55ef43`)
- **Criterion**: conventions section 8, item 4: "New code must not lower coverage."
- **Problem**: Per `frontend/coverage/coverage-summary.json` this file has 19% line and 19% branch coverage, and it alone accounts for the total moving from 98% to 90% (frontend total now 90.17% lines, 82.39% branches). The build report says it "has no jsdom unit test" because it measures layout. That holds for the real measurements, but the logic is pure arithmetic over numbers read from the DOM: `restPositions`, `fitsAt`, `settle` candidate choice (keeps focus when possible, nearest position, no-op under 0.5 px) and the `scrollend` vs 150 ms timer fallback. These can be unit-tested by stubbing `getBoundingClientRect`, `offsetLeft`/`offsetWidth`, `clientWidth`, `ResizeObserver` and `scrollTo`, as other tests in the repo stub browser APIs. The Safari fallback branch has no test at all (the report admits this), so a regression there would be invisible. The e2e test covers Chromium with `scrollend` only.
- **Suggestion**: Add unit tests with stubbed geometry for: overflow detection toggling `table-room`; settle moving to the nearest column start; settle keeping a focused control fully visible; no scroll when already at rest or when not overflowing; the timer fallback when `onscrollend` is absent; cleanup on unmount. Aim to bring frontend coverage back to at least 98%.

#### Non-blocking note
`useWholeColumns` re-measures only on ResizeObserver of region and table; a column content change that does not resize the table is not a case I could construct, so no finding.

### Summary (round 3)
CODE-2 is fixed correctly and tested, TDD order and AC-4 hold. One blocking finding: the new `useWholeColumns` hook is almost untested in unit tests and is the whole cause of the 98% to 90% coverage drop, which violates "new code must not lower coverage".

## Round 4

Reviewed `3d76aee..738b029`. Checks file: commit equals head, result pass (make check: backend 323 passed, frontend 321 passed, coverage 99%; make e2e 135 passed).

### Previous findings
| Id | Status | Note |
|---|---|---|
| CODE-1 | closed | Reading accepted by the owner in round 3. |
| CODE-2 | resolved | Unchanged since round 3. |
| CODE-3 | resolved | `bdee6bf` adds `useWholeColumns.test.tsx` (16 tests, stubbed geometry, ResizeObserver, scrollTo, fake timers). It covers overflow toggling of `table-room`, no-op at rest or within 0.5 px, no scroll when columns fit, skipping columns under the pinned column, focus kept whole, nearest fallback, the Safari 150 ms timer path, ignoring `scrollend` there, and cleanup on unmount. `coverage-summary.json`: the hook is at 100% lines and 90.7% branches; frontend total is 98.57% lines (was 90.17%), back to the 98% baseline. |

### TDD
UI-3: `3ba7140` (e2e only, adds the 375 x 667 viewport to the UI-2 focus-ring test) comes before `738b029` (CSS only). CODE-3: `bdee6bf` touches only a test file. Neither commit weakens or removes an assertion; the e2e change only adds a viewport.

### Review of the fix
`738b029` replaces the `[tabindex]:not([role="region"])` carve-out reasoning with `[role="region"][tabindex] { scroll-mb-2 }`. It sits in the same base layer as the UI-2 rule, is bottom-only, so a region taller than the viewport is still aligned by its top edge (AC-6 g unchanged). No JS or logic change.

### Findings
None.

### Summary (round 4)
CODE-3 is resolved with meaningful behavior tests and coverage is back to 98.57%; UI-3 is a small, correctly ordered CSS fix. No open findings.
