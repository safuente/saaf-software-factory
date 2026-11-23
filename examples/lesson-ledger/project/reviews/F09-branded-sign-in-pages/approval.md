---
feature: F09
project: PRJ-001
round: 1
decision: approved
route_to: human-merge
reviewed: feature/F09-branded-sign-in-pages @ cec9bc3b5a028f5af3a2dbdc4689f45cfef39f4b
spec_version: 1
---

# Approval: F09 Branded sign-in pages

## Round 1

### Preconditions
| Check | Result |
|---|---|
| Security review | pass @ cec9bc3 |
| Code review | pass @ cec9bc3 |
| UX review | pass @ cec9bc3 |
| UI review | pass @ cec9bc3 |
| Spec status / version | `approved`, v1 = build report v1 |
| Checks (`make check`, `make e2e`) | pass @ cec9bc3 (backend 323 passed / 1 skipped, frontend 493, e2e 276) |
| Branch on base | `main` (4ac8d92) is an ancestor of the head |

Independent checks: Playwright (Chromium) against `http://localhost:3107`, production build, script and screenshots in a temp directory outside the repo. Writes used two accounts created by this check through Sign up (`apr-f09-*@example.com`); seed data untouched (alice only logged in once, read-only, to compare the shell mark).

### Acceptance criteria
| Criterion | Tests | Independent check | Result |
|---|---|---|---|
| AC-1 wide layout | `e2e/f09-signed-out.spec.ts` "F09 AC-1 wide layout" (3 viewports × 2 pages); `signedOutPages.test.tsx` AC-1/AC-2 (order, SVG hygiene, mark = shell mark, drawing differs from mark and F08 drawings) | 1024×768, 1280×800, 1920×1080 on /login and /signup: `header` before the single `main`, header at x=0, height = viewport (768/800/1080), bg `rgb(27,31,38)` (shell), position static; header order svg mark, "Lesson Ledger", value line, illustration svg; header text exactly "Lesson Ledger Lessons, payments and pending fees in one place"; 0 focusables in header; both svgs `aria-hidden="true"`, `focusable="false"`, no title/desc/tabindex/style/script/href/data:/url(, every shape painted by a `fill-`/`stroke-` class or `none`; panel mark innerHTML identical to the shell mark after log in; wordmark 40 px (> 18), not in h1/a/button, contrast 15.02:1, value line 8.47:1; "Lesson Ledger" once in body; card bg white, radius 12 px (`panel`), top border `rgb(23,128,61)` 4 px (`paid`), width 448 = form 384 + padding 64, inside viewport; value line 768 ≤ measure 772 at 1920; scrollWidth − innerWidth = 0 everywhere | pass |
| AC-2 narrow layout | `e2e/f09-signed-out.spec.ts` "F09 AC-2 narrow layout" (4 viewports × 2 pages, Tab at 667×375) | 320×568, 375×667, 768×1024, 667×375: header first, full width, shell bg, static; mark + wordmark + value line, same SVG properties and contrast; exactly 1 visible svg (the mark); card has no border/bg, form column 384 px (or viewport − 32); no horizontal scroll; Tab at 667×375 on both pages: Email, Password, submit, link, none covered (elementFromPoint at the focused element's centre) | pass |
| AC-3 logged-out notice | `loggedOutNotice.test.tsx` (9); `e2e/f09-notice.spec.ts` AC-3a–e, AC-3f (5 tests), AC-3g (500, network) | Log out from /lessons: DELETE → 204, URL `http://localhost:3107/login` (no query/hash); `<p role="status">` (no aria-live, not alert) "You have logged out." in `main`, after h1, before and outside the form; text `rgb(29,33,39)` on `rgb(238,250,241)` (paid-wash, 15.07:1), border paid, no svg, not focusable, no alerts; focus on H1 "Log in"; Tab order Email, Password, Log in, Create an account; cookies before `[ll_session]` after `[]`, local/sessionStorage keys `[]` before and after; notice still shown after empty submit (field errors) and after "Email or password is incorrect."; none after reload, direct /login, Create an account → Log in, /lessons with `ll_session=not-a-real-token`, Back/Forward after log out, a real 401 DELETE (session deleted server-side first); DELETE 500 and aborted: stay on `/` with "Couldn't log out. Please try again." and no notice text. Screenshot: `login-notice-failed-1280.png` (temp dir) | pass |
| AC-4 entrance motion | `e2e/f08-motion.spec.ts` "F09 AC-4 entrance of the brand panel" (5); `motion.test.ts` "F09 ADR-008 entrance" | no-preference 1280×800: `document.getAnimations()` = one, `brand-enter` on the panel's content div, iterations 1, 700 ms, keyframes `opacity`, `transform` only; form inputs/buttons/link opacity 1, transform none at first measurement; 375×667 no-preference: no animation; reduce at 1280 and 375: no animation, panel opacity 1 / no transform. Token `--duration-entrance: 700ms`, easing `var(--ease-decelerate)`, inside `prefers-reduced-motion: no-preference` (app.css) | pass |
| AC-5 F01 behaviour, a11y, devices | `f09-signed-out.spec.ts` AC-5a, AC-5d, AC-5e; `f09-checks.spec.ts` AC-5c (14 states × motion); F01 unit/e2e unchanged; `f08-checks.spec.ts` AC-6c CSP | One main, one h1, Tab order and names as F01 at 1280 and 667 (above); CSP header of /login, /signup, /lessons byte-identical to the F08 constant `default-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'`; app pages after log in show no value line; no package changes in the diff | pass |
| AC-6 tests, docs, screenshots | `designDocF09.test.ts` (AC-6b–d); checks file | `make check`/`make e2e` pass @ head; `docs/design.md` Screenshots lists the 6 `f09-*.png` files, all in the diff; `CLAUDE.md` no longer says "shell only" / "above Get started … only", records ADR-008 placements and `motion-entrance`; pre-existing test changes limited to `f06-shell`, `f08-brand`, `f08-motion`, `pageChecks` (F08 "no brand on signed-out pages" checks replaced, motion list extended) | pass |

Behavior and Security considerations spot-checked: notice only after 204 (not 401, not 500/network); no URL, cookie or storage carries it (module-memory flag, `features/auth/loggedOut.ts`); notice has no user data; illustration not rendered visibly below 1024 px; card only from 1024 px; CSP unchanged.

### Definition of done
| Item | Result |
|---|---|
| Every criterion has tests referencing its id | pass |
| CI stages pass locally | pass (checks file @ cec9bc3) |
| Branch rebased on base | pass |
| Migrations included and reversible | not applicable (no backend change) |
| `make seed` reaches every UI state | pass: default, field/form errors need no account; notice via alice log in/out; expired session uses test SQL as the spec allows |
| README updated if setup changed | not applicable |
| No TODOs without a backlog item | pass (no TODO/FIXME added) |

### Decision
Approved, route to human merge. Every criterion passes in tests and in the independent checks against the running app. Per the spec's merge gate, the orchestrator must still show the owner the 6 AC-6 (d) screenshots and the live stack and ask "Do you approve the new Log in and Sign up pages?" before merging.

Note, not blocking: `e2e/f09-checks.spec.ts` calls `page.emulateMedia({ reducedMotion: "no-preference" })` per test, as AC-5 (c) requires and as `f08-checks.spec.ts` already did before F09; `f08-motion.spec.ts` is still the only file that overrides the suite's `reducedMotion` through `test.use`, which is how `motion.test.ts` reads AC-4 (f).

## Pull request description

```markdown
## F09: Branded sign-in pages

Log in and Sign up now carry the brand: from 1024 px a dark brand panel (logo mark, large "Lesson Ledger" wordmark, value line, a new ledger illustration) sits left of the form on a white card with a green top bar; below 1024 px a dark brand strip sits above the form. After a confirmed log out (204), Log in shows "You have logged out." once in a polite status region. The panel enters once per page appearance and not at all under reduced motion; all F01 fields, copy, validation and focus are unchanged.

Spec: projects/PRJ-001-lesson-ledger/specs/F09-branded-sign-in-pages.md (v1)

### Acceptance criteria
| Criterion | Verified by |
|---|---|
| AC-1 Wide split layout, brand panel and card | e2e/f09-signed-out.spec.ts "F09 AC-1 wide layout", signedOutPages.test.tsx, independent check |
| AC-2 Narrow brand strip, no illustration | e2e/f09-signed-out.spec.ts "F09 AC-2 narrow layout", independent check |
| AC-3 "You have logged out." after a 204 log out only | e2e/f09-notice.spec.ts, loggedOutNotice.test.tsx, independent check |
| AC-4 One entrance from 1024 px, none under reduced motion | e2e/f08-motion.spec.ts "F09 AC-4", motion.test.ts, independent check |
| AC-5 F01 behaviour, accessibility, devices, CSP | e2e/f09-signed-out.spec.ts AC-5a/d/e, e2e/f09-checks.spec.ts AC-5c, e2e/f08-checks.spec.ts AC-6c, independent check |
| AC-6 Checks, design doc, agent notes, 6 screenshots | make check, make e2e, designDocF09.test.ts, independent check |

### Reviews
Security: pass · Code: pass · UX: pass · UI: pass · Rounds: 1

### Notes for the reviewer
- Merge gate (ADR-006/007/008): the owner approves the 6 screenshots in docs/design/f09-*.png and the live pages before merge; value line wording and the card accent can still change there.
- No backend, API, migration, seed, configuration or dependency change. CSP unchanged.
- New theme tokens: `--text-display`, `--container-card`, `--container-illustration`, `--duration-entrance`; new keyframes `brand-enter` and utility `motion-entrance` (ADR-008).
- The logged-out flag is in-memory only (`features/auth/loggedOut.ts`); it does not survive a reload by design.
```

## Owner approval

Approved by Santiago Alvarez on 2026-11-23 (new Log in and Sign up pages) after the 6 screenshots in `docs/design/f09-*.png` and the live stack. Open suggestions (UI-1 illustration size at 1920 px, CODE-1 test edits in feat commits) left for a follow-up. Merged locally into main.
