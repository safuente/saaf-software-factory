---
feature: F05
project: PRJ-001
round: 4
decision: approved
route_to: human-merge
reviewed: feature/F05-restyle-remaining-pages @ 738b029bdd3f7fbb5d3028c0208dfc522994339b
spec_version: 1
---

# Approval: F05 Restyle the remaining pages

## Round 4 (first run)

### Preconditions
| Check | Result |
|---|---|
| Security review | pass @ 738b029 (round 4) |
| Code review | pass @ 738b029 (round 4) |
| UX review | **stale**: pass @ 3d76aee (round 3); `git diff 3d76aee..738b029` changes files under `frontend/` |
| UI review | pass @ 738b029 (round 4), 1 suggestion (UI-1, accepted by the owner) |
| Spec | `status: approved`, `version: 1`; build report names version 1 |
| Checks (`make check`, `make e2e`) | pass @ 738b029bdd3f7fbb5d3028c0208dfc522994339b (backend 323 passed / 1 skipped, frontend 321 passed, e2e 135 passed) |

Acceptance criteria and Definition of done were not verified this round: a precondition failed.

### Findings

#### APR-1: UX review not made on the current head
- **Severity**: blocking
- **Category**: definition-of-done
- **Location**: `projects/PRJ-001-lesson-ledger/reviews/F05-restyle-remaining-pages/ux-reviewer.md` frontmatter
- **Criterion**: none (approval precondition)
- **Problem**: The UX review's latest round (3) reviewed `3d76aee`. Since then the head moved to `738b029`, and the change touches the frontend, so the UX review is stale under the approval preconditions. The round 4 scope recorded in the build report (CODE-3 and UI-3 only) limits what the Builder changes, not which reviews must cover the head.
- **Evidence**: `git -C workspaces/.worktrees/lesson-ledger/F05-restyle-remaining-pages diff --stat 3d76aee..738b029`:
  ```
  frontend/e2e/f05-pages.spec.ts                  |   2 +
  frontend/src/shared/styles/app.css              |  10 +-
  frontend/src/shared/ui/useWholeColumns.test.tsx | 301 ++++++++++++++++++++++++
  ```
  The production change is `frontend/src/shared/styles/app.css`: `[role="region"][tabindex] { @apply scroll-mb-2; }`, which changes where the page scrolls when Tab reaches a table region.
- **Suggestion**: Run the UX reviewer at round 4 on `3d76aee..738b029` (one CSS rule; check that tabbing into the `/summary`, `/pending` and `/lessons` table regions and on to their row buttons still reads naturally at 375×667 and 667×375). No Builder work is needed unless that review finds something.

### Decision
Rejected on a precondition only, routed to the UX reviewer for a round 4 pass on head `738b029`; no Builder loop. Security, code, UI and the checks are all current and passing. This is not escalated under the round 3+ rule because nothing is failing to converge: it is a missing re-review of a one-rule CSS change. Once the UX file shows `round: 4`, `reviewed: … @ 738b029…` and `verdict: pass`, run the Approver again for the criteria check.

## Round 4 (re-run after APR-1)

Evidence script and screenshots: `/private/tmp/claude-501/-Users-saaf-workspace-saaf-software-factory/1970f24f-a397-48d4-a233-ca6562813eac/scratchpad/apr/check.cjs` and `.../scratchpad/apr/shots/` (Playwright Chromium against `http://localhost:3103`, freshly seeded; 109 of 110 checks pass, the one flagged is explained under AC-5).

### Previous findings
| Id | Status | Note |
|---|---|---|
| APR-1 | resolved | `ux-reviewer.md` is `round: 4`, `verdict: pass`, reviewed `738b029`; no new findings, UX-1 stays an owner-accepted suggestion. |

### Preconditions
| Check | Result |
|---|---|
| Security review | pass @ 738b029 (round 4) |
| Code review | pass @ 738b029 (round 4) |
| UX review | pass @ 738b029 (round 4), 1 suggestion (UX-1, accepted by the owner) |
| UI review | pass @ 738b029 (round 4), 1 suggestion (UI-1, accepted by the owner) |
| Spec | `status: approved`, `version: 1`; build report names version 1 |
| Checks (`make check`, `make e2e`) | pass @ 738b029bdd3f7fbb5d3028c0208dfc522994339b (head of branch); backend 323 passed / 1 skipped, frontend 321 passed, e2e 135 passed |

### Acceptance criteria
| Criterion | Tests | Independent check | Result |
|---|---|---|---|
| AC-1 a | `designDoc.test.ts` "F05 AC-1a …" (root 18 px, Rendered column for every step, breakpoints) | `docs/design.md`: "Rendered sizes" states 18 px root; Type scale, Spacing, Radii, Breakpoints tables each have a Rendered column (`display` 54 px, `title` 40.5 px, `content` 1296 px, `form` 504 px); breakpoints 640/768/1024 px | pass |
| AC-1 b | `f05-rendered-sizes.spec.ts` "AC-1b /login at 1280 x 800 …" | /login 1280×800: root 18px, h1 54px, label 18px, input 20.25px, main max-width 1296px, form 504 px | pass |
| AC-1 c | `designDoc.test.ts` "F05 AC-1c …" | "Page patterns" describes table, pinned Student column, payment status, totals list, pending total, month navigation, using theme names only | pass |
| AC-1 d | `designDoc.test.ts` "F05 AC-1d …" (files exist) | Screenshots table lists the 5 pages at 375/1280; all 10 files present in `docs/design/` | pass |
| AC-2 a | `theme.test.ts` "F05 AC-2a …" | `find frontend/src -name '*.css'` returns only `shared/styles/app.css`; `ui.module.css` and `tokens.css` deleted in the diff | pass |
| AC-2 b | `theme.test.ts` "F05 AC-2b …", AC-2c literal/arbitrary tests widened to all non-test sources | grep of non-test `.ts/.tsx`: no `style=`, no `-[…]` arbitrary classes, no hex/`px`/`rgb(`; custom CSS in `app.css` (`table-room`, scroll margins) uses only theme variables/utilities | pass |
| AC-2 c | `composition.test.ts` "F05 AC-2c …" (2 tests) | Pages render `Table`, `Totals`, `PaymentStatus`, `Section`, `Button`, fields from `shared/ui` (source read) | pass |
| AC-2 d | `theme.test.ts` "F05 AC-2d …" | Parser at `src/test/designDoc.ts`; only importers are `designDoc.test.ts` and `theme.test.ts` | pass |
| AC-3 a | `f05-tables.spec.ts` "AC-3a …"; `Table.test.tsx` | As alice at 1280: captions "Your lessons, newest first" / "Lessons in November 2026, newest first" / "Unpaid lessons, oldest first", headers in main's order (compared with `git show main:` sources), every `th` `border-bottom-style: double`, Price header and cells `text-align: right` + `tabular-nums`, region `tabindex=0` labelled by the caption | pass |
| AC-3 b | `f05-tables.spec.ts` "AC-3b …"; `PaymentStatus.test.tsx` | Status cells on /lessons and /summary contain only "Paid"/"Unpaid" | pass |
| AC-3 c | `f05-tables.spec.ts` "AC-3c …"; `Totals.test.tsx` | /summary `dl dt` = "Lessons:", "Collected:", "Pending:"; /pending "Total pending: $363.00 across 9 lessons" | pass |
| AC-3 d | `f05-tables.spec.ts` "AC-3d at 320/375 px …" (uses `elementFromPoint`) | 320 and 375 px, each table scrolled fully right (scrollWidth 982–1111 vs clientWidth 284/339), every row (12/4/9): Student cell inside the region box and topmost at its centre; screenshot `shots/summary-scrolled-375.png` | pass |
| AC-3 e | `f05-tables.spec.ts` "AC-3e …" | Tables 1224 px ≤ `main` 1296 px at 1920; ≤ `main` at 1280 | pass |
| AC-4 | full `make check`/`make e2e` green; axe tags in `accessibility.spec.ts`, `f03-payments.spec.ts` | Diff of pre-existing tests: only `wcag22aa` additions, seed moved to `globalSetup`, and `ac1-signup.spec.ts` uses a unique teacher instead of seed carol; no assertion removed or weakened (case/whitespace normalization still exercised). Touch flow: mark → "Collected: $45.00 / Pending: $0.00", undo → "$0.00 / $45.00"; /pending mark removes the row | pass |
| AC-5 | `f04-fonts-csp.spec.ts` (all 7 routes, docstring names F05 AC-5) | CSP on /login, /signup and the 5 app pages equals `default-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'`; no `securitypolicyviolation`; all font requests to `http://localhost:3103/assets/…woff2`; `document.fonts` Alegreya and Alegreya Sans `loaded`. Only non-2xx: `GET /api/sessions/current` 401 on the anonymous /login and /signup loads, the expected F01 session probe, not a failed request (the e2e counts `requestfailed` and 5xx, as accepted at F04) | pass |
| AC-6 a | `f05-pages.spec.ts` "AC-6 a-d, f, g <page> <state>" (19 states) | axe `wcag2a/2aa/21aa/22aa` 0 violations on all 5 pages; no interactive element < 24×24; with reduced motion no element has transition/animation > 0.01ms | pass |
| AC-6 b | same | 375/768/1280: no page h-scroll; /summary Prev/Next tops equal (Δ0), no overlap with month heading; one row at 768 and 1280 (`shots/summary-1280.png`) | pass |
| AC-6 c | same | 320×568: no h-scroll, no element outside 0–320 px except inside table regions; Prev/Next share a row | pass |
| AC-6 d | same | 1920: `main` 1296 px; no body text block over 80ch | pass |
| AC-6 e | `f05-pages.spec.ts` "AC-6e …" (hover parity, taps-only flow) | New teacher `apr-1795079957456@example.com`, 375×667 touch: add student, record lesson, mark/undo on /summary, change month, mark on /pending, log out, all by tap | pass |
| AC-6 f | `f05-pages.spec.ts` AC-6 f checks and "AC-6f at 200% text …" | Root set to 36 px via CSSOM at 1280: no page h-scroll on all 5 pages | pass |
| AC-6 g | `f05-pages.spec.ts` "AC-6g …" | 667×375: no vertically fixed/sticky element; Tab through every page as alice, each focused element inside the viewport (or filling it, per the owner's reading) | pass |
| Behavior / Security | — | Bob empty states and carol truncation messages at 320/375 render with no page h-scroll; copy unchanged; no new endpoints, no inline style, parser not in production sources | pass |

### Definition of done
| Item | Result |
|---|---|
| Every criterion has tests referencing its id | pass (AC-1a … AC-6g each named in unit or e2e test titles) |
| CI stages pass locally | pass (checks file @ head) |
| Branch rebased on base | pass (`main` 53f2bf2 is an ancestor of head) |
| Migrations included and reversible | not applicable (no backend changes) |
| `make seed` reaches every UI state | pass (alice default, bob empty, carol many reached; error states per README) |
| README updated if setup changed | not applicable (no setup change) |
| No TODOs without a backlog item | pass (none in `frontend/src`, `frontend/e2e`) |

### Findings
None.

### Decision
Approved, routed to human merge. All preconditions now hold on head `738b029`, every acceptance criterion is covered by tests that name it and was confirmed against the running app, and the Definition of done is met.

## Pull request description

```markdown
## F05: Restyle the remaining pages

Home, Students, Lessons, Monthly summary and Pending payments are rebuilt from F04's theme and shared components, so the whole frontend has one styling system (no CSS modules or tokens file). Tables scroll inside their own region with the Student column pinned, "Next month" no longer wraps below the month heading, and `docs/design.md` now states the rendered px sizes. The F04 multi-device checks (WCAG 2.2 AA, reflow, touch, 200% text, short landscape) now cover every page.

Spec: projects/PRJ-001-lesson-ledger/specs/F05-restyle-remaining-pages.md (v1)

### Acceptance criteria
| Criterion | Verified by |
|---|---|
| AC-1 design doc states rendered sizes; F04 sizes unchanged; F05 patterns and screenshots documented | designDoc.test.ts F05 AC-1a/c/d, f05-rendered-sizes.spec.ts AC-1b, independent check |
| AC-2 one stylesheet, no literal values or style attributes, shared components only, parser moved to test support | theme.test.ts F05 AC-2a/b/d, composition.test.ts F05 AC-2c, independent check |
| AC-3 shared tables, Paid/Unpaid text, totals, pinned Student column at 320/375, width capped at main | f05-tables.spec.ts AC-3a–e, Table/PaymentStatus/Totals unit tests, independent check |
| AC-4 no behavior change, no weakened tests | full make check / make e2e, test diff review, independent check |
| AC-5 CSP unchanged, self-hosted fonts load | f04-fonts-csp.spec.ts, independent check |
| AC-6 accessibility and multi-device checks on every page | f05-pages.spec.ts AC-6 a–g, independent check |

### Reviews
Security: pass · Code: pass · UX: pass · UI: pass · Rounds: 4

### Notes for the reviewer
- No migrations, no new dependencies, no config or CSP change.
- Theme gains one token, `--spacing-0: 0` (needed for `left-0` / `border-spacing-0`); palette, typefaces and type scale unchanged.
- Owner-authorised F03 behavior change (CODE-2): after mark/undo, the list and total refresh waits for the last pending mark/undo on the page and also runs after a failed request; f03-payments e2e assertions unchanged.
- New `useWholeColumns` hook snaps sideways-scrolled tables to whole columns; Safari's no-`scrollend` 150 ms fallback is unit-tested only, not in a real Safari.
- E2E seeding moved to Playwright `globalSetup`; seed accounts are read-only to specs (`ac1-signup.spec.ts` now uses a unique teacher instead of carol).
- Open, owner-accepted suggestions: UX-1 (row action off-screen on phones without a scroll cue), UI-1. Known limit: Shift+Tab back up to a short table region can cut its top focus ring.
```
