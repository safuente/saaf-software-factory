---
feature: F08
project: PRJ-001
round: 1
decision: approved
route_to: human-merge
reviewed: feature/F08-icons-brand-and-motion @ 7bac4f31a5d3771c81e5e7ae3cb5d77d024ea697
spec_version: 1
---

# Approval: F08 Icons, brand and motion

## Round 1

### Preconditions
| Check | Result |
|---|---|
| Security review | pass @ 7bac4f3 (1 suggestion: SEC-1, same-day lucide-react release) |
| Code review | pass @ 7bac4f3 |
| UX review | pass @ 7bac4f3 |
| UI review | pass @ 7bac4f3 (2 suggestions: UI-1 top-bar spacing, UI-2 faint illustrations) |
| Spec | `status: approved`, v1; build report v1 |
| Checks (`make check`, `make e2e`) | pass @ 7bac4f3 (backend 323 + 1 skipped, frontend 462, e2e 227; F01 timing test flaky on first run, F08 touches no backend file, full rerun passed) |
| Branch | head 7bac4f3; merge-base with `main` is `main`'s head f56924c (rebased) |

### Acceptance criteria
Independent checks ran against http://localhost:3106 with Playwright (Chromium) scripts in a scratch directory. Test teachers created through `POST /api/teachers` with the `apr-` prefix; seed accounts were only read (no seed lesson was marked).

| Criterion | Tests | Independent check | Result |
|---|---|---|---|
| AC-1 (a) | `e2e/f08-icons.spec.ts` "AC-1a,b,c every page…", "AC-1a,c the log-in error alert…"; `src/shared/ui/icons.test.tsx`; `src/features/icons.test.tsx` | As alice at 1280 px, every `svg` on `/`, `/lessons`, `/students`, `/summary`, `/pending`: sidebar links carry `lucide-house`, `lucide-music`, `lucide-users`, `lucide-chart-column`, `lucide-clock`; Log out `lucide-log-out`; Home quick actions `calendar-plus` / `user-plus`; Lessons submit `calendar-plus`; Students submit `user-plus`; every Mark as paid (5 on `/`, 3 on `/summary`, 9 on `/pending`) `lucide-check`; Undo paid `lucide-undo-2`. Each is the host's first child. Log-in alert "Email or password is incorrect." and the 500 mark alert "We couldn't reach Lesson Ledger. Please try again." each start with `lucide-circle-alert` | pass |
| AC-1 (b) | same | No other `svg` on those pages apart from the brand mark and the metrics bar (both not icons); `/login`, `/signup` have 0 `svg` | pass |
| AC-1 (c) | `f08-icons.spec.ts` "AC-1c icons are never focusable"; unit tests with `getByRole(…, exact)` | Every icon `aria-hidden="true"`, `focusable="false"`, no `tabindex`, no `title`/`desc`; alert text exactly pre-F08 | pass |
| AC-1 (d) | `f08-icons.spec.ts` "AC-1d Saving…"; `features/icons.test.tsx` | Test teacher, PATCH delayed 1.5 s: button reads "Saving…", disabled, 0 `svg`; afterwards "Undo paid" with 1 `svg` | pass |
| AC-1 (e) | `f08-icons.spec.ts` "AC-1e,f …normal, hover and focus", "AC-1e Log out while logging out" | Icons use `currentColor` (`Icon.tsx`); covered by e2e measurement, not re-measured | pass |
| AC-1 (f) | `f08-icons.spec.ts` "AC-1e,f" | Screenshot: current link keeps the F06 pill and bold text; same glyph on current and other links | pass |
| AC-2 (a) | `e2e/f08-brand.spec.ts`; `src/shared/ui/brand.test.tsx` | 5 app pages at 1280: `[data-brand]` precedes the "Main" `nav`, text "Lesson Ledger" in a `span`, not inside `a`/`h*`/`button`; 1 `h1`, 1 `main`, 1 "Main" nav. At 375 px on `/summary` brand at top 12 px, before the nav, no horizontal scroll | pass |
| AC-2 (b) | `f08-brand.spec.ts` | `/login`, `/signup`: no `[data-brand]`, 0 `svg`, no "Lesson Ledger" in body text | pass |
| AC-2 (c) | `f08-brand.spec.ts`; `brand.test.tsx` | Served `/` contains `<link rel="icon" type="image/svg+xml" href="/favicon.svg" />`. `curl -sI /favicon.svg` → 200, `Content-Type: image/svg+xml`; `X-Content-Type-Options`, `Referrer-Policy`, `Content-Security-Policy` identical to `/` (diff empty). File and `Brand.tsx` have no `style`, `<style>`, `<script>`, `data:` or external URL | pass |
| AC-2 (d) | `brand.test.tsx` | `favicon.svg` paths equal `Brand.tsx` paths; colours #ffffff, #868d98, #1d2127, #17803d = `--color-canvas`, `-outline`, `-graphite`, `-paid` in `app.css`, the classes the inline mark uses | pass |
| AC-3 (a) | `src/features/illustrations.test.tsx`; `e2e/f08-illustrations.spec.ts` | Bob on `/`, `/students`, `/lessons`, `/summary`, `/pending`, alice on `/summary?month=2000-01`: exactly 1 `[data-illustration]`, `aria-hidden="true"`, no `title`/`desc`, not in a table, no `style`, only `fill="none"` as attribute (colours via theme classes); next element is the message ("You have no students yet…", "No lessons recorded yet.", "No lessons in November 2026.", "Nothing pending. Every lesson is paid.", Get started list) | pass |
| AC-3 (b) | F02/F03/F07 tests unchanged in the diff; `illustrations.test.tsx` | Message texts above read exactly as before; `git diff main...HEAD` touches no pre-F08 test apart from `theme.test.ts` | pass |
| AC-3 (c) | `illustrations.test.tsx` | 0 illustrations on alice's 5 pages (Home with in-section content) | pass |
| AC-4 (a) | `e2e/f08-motion.spec.ts` "AC-4a interaction transitions" | Home at 1280, no-preference: every sidebar link, button, quick action and text link has `transition-property: color, background-color, border-color, text-decoration-color`, `transition-duration: 0.18s`; outline not transitioned | pass |
| AC-4 (b) | `f08-motion.spec.ts` "AC-4b,c,d,e then AC-5b" | `/summary` load: `grow-in` on the bar `rect`, iterations 1, 600 ms. Test teacher, after settling: mark → only `paid-highlight` starts; undo → no animation starts, `getAnimations()` empty | pass |
| AC-4 (c) | same; `features/motion.test.tsx` | `/summary` load: `fade-in` ×1, 300 ms on 3 `dd` and the percentage and average `p`. Home load (API delayed 300 ms): `fade-in` on the 4 figure `dd`s. No fade on mark/undo; fade runs again on month change (load after "Loading…") | pass |
| AC-4 (d) | same | Test teacher with F03 AC-1 data, `/summary?month=2026-11`, keyboard "Mark as paid" on lesson B: 6 `td` run `paid-highlight` ×1, 900 ms; frozen at t=0 cells are rgb(238,250,241); row text rgb(29,33,39) 15.07:1, "Undo paid" border 3.12:1, focus ring rgb(77,141,247) 3.03:1; Status "Paid", status region "Marked as paid. Collected: $102.50, pending: $0.00.", focus on "Undo paid". Undo, a 500 mark failure, Mark as paid on `/pending` (4→3 rows) and on Home: no animation starts | pass |
| AC-4 (e) | same | Computed scan of every element on the 5 alice pages: all `animation-iteration-count` 1, longest duration 600 ms (highlight 900 ms) | pass |
| AC-5 (a) | existing F05/F07 per-state checks, now under suite-wide `reduce` | `/summary` under reduce: longest transition/animation 0 ms | pass |
| AC-5 (b) | `f08-motion.spec.ts` "…then AC-5b" | Test teacher, reduce, first measurement: paid `rect` width 41 of 100, all panel figures opacity 1, 0 animations; after marking B every row's computed background equals the others' | pass |
| AC-5 (c) | `motion.test.ts` "AC-5c…"; `playwright.config.ts` `use.reducedMotion: "reduce"`; build report: `--repeat-each=10` 30/30 | Config read. See Note 1 on the CSP test | pass |
| AC-6 (a) | existing F05-F07 e2e (unchanged); `e2e/f08-checks.spec.ts` "AC-6a…" | 320 px and 1280 px at 200% root text, alice and bob, 5 pages: no horizontal page scroll; the only icons beyond the viewport edge are Mark/Undo icons inside scrolling tables (F05 AC-3 d behaviour) | pass |
| AC-6 (b) | checks file | pass @ 7bac4f3; only pre-existing test changed is `theme.test.ts`, which adds the Icons/Motion tables and the `ease` namespace (stricter) | pass |
| AC-6 (c) | `f08-checks.spec.ts` "AC-6c…"; `designDocF08.test.ts` | No nginx/CSP file in the diff; CSP header on `/` and `/favicon.svg` identical; no CSP console message on 5 app pages; `"lucide-react": "1.76.0"` exact with lock entry; scan passed | pass |
| AC-6 (d) | `designDocF08.test.ts`, `theme.test.ts`, `motion.test.ts` "AC-6d" | `docs/design.md` names lucide-react 1.76.0 ISC, icon map, brand, illustrations, motion tokens; "Product logo" Adopted; `CLAUDE.md` replaces "no motion" with the ADR-007 rules; no "no motion" in `frontend/src` sources | pass |
| AC-6 (e) | `designDocF08.test.ts` | 18 `docs/design/f08-*.png` listed in "Screenshots" and present in the diff | pass |

Behavior and Security considerations spot checks: highlight only on `/summary` mark success (verified above); no icon while "Saving…" (verified); load motion re-runs on month change but not on in-place updates (verified); CSP unchanged and favicon same-origin (verified).

Note 1 (non-blocking): AC-5 (c) says exactly one test file overrides the suite's `reduce` default. `e2e/f08-checks.spec.ts:120-124` also calls `page.emulateMedia({ reducedMotion })` with `"no-preference"` for the AC-6 (c) CSP test, which AC-6 (c) requires ("with or without reduced motion"). The test reads only headers and violation events, never motion state or time, so the criterion's purpose (deterministic e2e, motion checked in one file) holds. The guard in `motion.test.ts:171-181` matches only the literal `reducedMotion: "no-preference"`, so it does not see the loop variable. Not a reason to loop the feature; worth tightening if the file is touched again.

### Definition of done
| Item | Result |
|---|---|
| Every criterion has tests referencing its id | pass (AC-1 to AC-6 referenced in the 11 new test files) |
| CI stages pass locally | pass @ 7bac4f3 |
| Branch rebased on base | pass (merge-base = `main` head f56924c) |
| Migrations included and reversible | not applicable (no backend change) |
| `make seed` reaches every UI state | pass (alice and bob reach the illustrated and motion states; saving/error states via request delay/failure as in README) |
| README updated if setup changed | not applicable (new npm dependency installs through existing `make check`; no command or config change) |
| No TODOs without a backlog item | pass (no TODO/FIXME added in the diff) |

### Findings
None.

### Decision
Approved, route to human merge. Every criterion of F08 v1 is covered by tests as written and confirmed against the running app. The owner's approval of the 18 screenshots and live motion (ADR-006/007 merge gate) is still pending and runs separately.

## Pull request description

```markdown
## F08: Icons, brand and motion

Adds decorative Lucide icons before the text of the sidebar links, the main action buttons and alerts; an original logo mark with the "Lesson Ledger" wordmark at the top of the shell, plus a matching SVG favicon; small original illustrations above Home's "Get started" and the four list empty states; and subtle CSS motion (150-200 ms colour transitions, a one-time bar grow and figure fade on load, a green highlight on a row just marked as paid on Monthly summary), all off under `prefers-reduced-motion: reduce`. No behaviour, copy, accessible name or API changes.

Spec: projects/PRJ-001-lesson-ledger/specs/F08-icons-brand-and-motion.md (v1)

### Acceptance criteria
| Criterion | Verified by |
|---|---|
| AC-1 Icons on the listed controls and alerts only; hidden, names unchanged, none while "Saving…", contrast | `e2e/f08-icons.spec.ts`, `src/shared/ui/icons.test.tsx`, `src/features/icons.test.tsx`, independent check |
| AC-2 Logo and wordmark in sidebar/top bar, none on login/signup, same-origin favicon matching the mark | `e2e/f08-brand.spec.ts`, `src/shared/ui/brand.test.tsx`, independent check |
| AC-3 One illustration above "Get started" and the four empty states, nowhere else; texts unchanged | `e2e/f08-illustrations.spec.ts`, `src/features/illustrations.test.tsx`, independent check |
| AC-4 Colour-only 180 ms transitions; bar grow and figure fade once on load; paid highlight on /summary only, contrast held | `e2e/f08-motion.spec.ts`, `src/features/motion.test.tsx`, `src/shared/styles/motion.test.ts`, independent check |
| AC-5 Nothing moves under reduced motion; e2e runs under reduce by default | `e2e/f08-motion.spec.ts`, `motion.test.ts`, `playwright.config.ts`, independent check |
| AC-6 Regressions, a11y, devices, CSP unchanged, pinned dependency, design doc, 18 screenshots | existing F05-F07 e2e, `e2e/f08-checks.spec.ts`, `src/shared/styles/designDocF08.test.ts`, `make check`, independent check |

### Reviews
Security: pass · Code: pass · UX: pass · UI: pass · Rounds: 1

### Notes for the reviewer
- New runtime dependency: `lucide-react` 1.76.0 (ISC), exact pin, lock file updated. SEC-1: the release was published the day it was pinned; consider waiting or re-checking advisories before merge.
- New static asset `frontend/public/favicon.svg`; CSP unchanged.
- Playwright now runs with `reducedMotion: "reduce"` suite-wide; `e2e/f08-motion.spec.ts` checks motion with it off.
- No migrations, backend, API or seed changes.
- Merge gate (ADR-006/007): owner approval of the 18 `docs/design/f08-*.png` screenshots and the live motion is still required.
- Open UI suggestions: UI-1 (no gap under the brand in the top bar below 1024 px), UI-2 (illustrations faint on white).
```

## Owner approval

Approved by Santiago Alvarez on 2026-11-19 (icons, logo, illustrations and motion) after the 18 screenshots in docs/design/f08-*.png and a live trial on the F08 stack (ADR-006/007 merge gate). Open suggestions (SEC-1 lucide-react release age, UI-1, UI-2, approver note on AC-5 c guard) left for a follow-up. Merged locally into main.
