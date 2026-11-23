# Build report: F09 Branded sign-in pages

- Spec: projects/PRJ-001-lesson-ledger/specs/F09-branded-sign-in-pages.md (version 1)
- Repo: workspaces/.worktrees/lesson-ledger/F09-branded-sign-in-pages
- Branch: feature/F09-branded-sign-in-pages
- Mode: build
- Result: complete

## Criteria
| Criterion | Tests | Status |
|---|---|---|
| AC-1 (a–f) wide layout | `e2e/f09-signed-out.spec.ts` "F09 AC-1 wide layout" (1024×768, 1280×800, 1920×1080 × /login, /signup); `src/features/auth/signedOutPages.test.tsx` AC-1a–e (landmarks, order, SVG hygiene, mark = shell mark, drawing shares no shape with the mark or the 5 F08 drawings, wordmark plain text, card holds h1 + form) | passing |
| AC-2 (a–c) narrow layout | `e2e/f09-signed-out.spec.ts` "F09 AC-2 narrow layout" (320×568, 375×667, 768×1024, 667×375; Tab at 667×375, nothing covered) | passing |
| AC-3 (a–g) logged-out notice | `src/features/auth/loggedOutNotice.test.tsx` (9 tests); `e2e/f09-notice.spec.ts` (204 → notice, polite, between h1 and form, not danger, ≥ 4.5:1, focus on h1, no cookie/storage key added, stays after field error and failed log in; none after reload, Back/redirect/Forward, Sign up → Log in, direct /login, `/` and `/lessons` without cookie / bogus cookie / expired session, a real 401 DELETE; 500 and network error keep the page) | passing |
| AC-4 (a–f) entrance motion | `e2e/f08-motion.spec.ts` "F09 AC-4 entrance of the brand panel" (5 tests; computed styles and animation state only, animations frozen via CDP); `src/shared/styles/motion.test.ts` "F09 ADR-008 entrance" (token ≤ 1 s, keyframes opacity/transform only, used only as `lg:motion-entrance` in SignedOutPage). File still the only override; passes `--repeat-each=10` (80/80) | passing |
| AC-5 (a) landmarks, titles, Tab order, names | `e2e/f09-signed-out.spec.ts` AC-5a at 375 and 1280 | passing (already true before F09; kept as regression) |
| AC-5 (b) F01 behaviour | F01 unit and e2e tests unchanged and passing (`LoginPage.test.tsx`, `SignupPage.test.tsx`, `ac1`–`ac5` e2e) | passing |
| AC-5 (c) per-state checks | `e2e/f09-checks.spec.ts`: `checkPageState` on /login default, field errors, form error, notice and /signup default, field errors, form error, with reduce and no-preference (14 tests) | passing |
| AC-5 (d) 200% text | `e2e/f09-signed-out.spec.ts` AC-5d at 1280×800 and 375×667; also `f08-checks` graphics at 200% and `f04-restyled-parts` AC-6f | passing |
| AC-5 (e) app pages unchanged | `e2e/f09-signed-out.spec.ts` AC-5e (session-check error state, every app page at 375/1280); F08 AC-2a and AC-6a e2e unchanged | passing |
| AC-5 (f) CSP, no violation, no dependency | `e2e/f08-checks.spec.ts` "AC-6c" (unchanged; /login and /signup, both motion settings, F07/F08 header byte-identical); no package change | passing |
| AC-6 (a) checks, test diff | `make check`, `make e2e` (276 passed) | passing |
| AC-6 (b–d) design doc, notes, screenshots | `src/shared/styles/designDocF09.test.ts` (8 tests); theme test covers the new token rows | passing |

## Checks
| Stage | Command | Result |
|---|---|---|
| Install, lint, typecheck, test, build, scan | `make check` | pass; backend 323 passed, 1 skipped, coverage 99%; frontend 493 passed, coverage 99% |
| E2E | `make e2e` | pass, 276 passed |
| Motion repeat | `npx playwright test e2e/f08-motion.spec.ts --repeat-each=10` | pass, 80 passed |

## Changes
- New dependencies: none
- Migrations: none. Backend, API, OpenAPI and seed unchanged.
- Frontend:
  - `shared/ui/SignedOutPage.tsx` (new): Log in / Sign up layout. `header` brand panel from `lg` (`shell`, half width, ≥ viewport height, mark at `size-12`, wordmark `text-display`, value line `shell-muted`, drawing at the bottom), brand strip below `lg`; `main` with a `canvas` card from `lg` (`rule` border, `paid` top bar, `panel` radius, `p-8`, `max-w-card`). It also renders Log in's always-present `role="status"` notice region.
  - `shared/ui/BrandIllustration.tsx` (new): the ledger drawing (a month page on a second page, four rows with a note and an amount, three paid ticks, one amber pending ring, a green paid seal).
  - `shared/ui/Brand.tsx`: `LogoMark` extracted (same drawing in the shell and the panel).
  - `shared/ui/Page.tsx`: `documentTitle` and `useHeadingFocus` extracted for reuse. `Page` without `nav` (session-check states) unchanged.
  - `features/auth/loggedOut.ts` (new): one-shot in-memory flag. `LogOutProvider` sets it on 204 only. `LoginPage` takes it in a timer after mount, so the status region exists before its text arrives (announced) and StrictMode's cancelled effect does not consume it.
  - Theme (`app.css` + `docs/design.md` tables): `--text-display` 2.5rem/1.1, `--container-card` 28rem, `--container-illustration` 24rem, `--duration-entrance` 700ms, keyframes `brand-enter`, utility `motion-entrance`. No new colour.
- Docs: `docs/design.md` (Direction note, Layout with wireframe, Brand, Illustrations, Motion entrance, Components "Logged-out notice", new token rows, Product logo row, F09 screenshots). `CLAUDE.md` (no more "shell only" / "four list empty states only"; ADR-008 placements, `SignedOutPage`, notice, `motion-entrance`).
- Screenshots: `docs/design/f09-login-375.png`, `f09-login-1280.png`, `f09-signup-375.png`, `f09-signup-1280.png`, `f09-login-notice-1280.png`, `f09-login-errors-1280.png` (production build, reduced motion, full page).
- Tests changed rather than added (allowed by AC-6 a):
  - `e2e/f08-brand.spec.ts` AC-2b: "no logo, wordmark or svg on /login, /signup" replaced by "mark and wordmark once, in the brand header only, no nav, no svg in main".
  - `e2e/f06-shell.spec.ts` AC-2g: `header` count 0 replaced by "one header with no link or button, no navigation". This encoded "brand in the shell only". The white-page, title and primary-button assertions are unchanged.
  - `e2e/support/pageChecks.ts` `checkPageState`: new optional `minStops` (default 6, the same as the former `> 5`) and `motion: "on"`, which bounds motion by 1 s instead of 0.01 ms when run without reduced motion. Existing callers behave as before.
  - `e2e/f08-motion.spec.ts`: F09 block appended and the header comment extended. F08 tests untouched.

## Open issues
- **Merge gate (ADR-006/007/008)**: the owner needs to approve the 6 screenshots and try the entrance and notice live. The question is "Do you approve the new Log in and Sign up pages?". The owner may also change the value line wording and the `paid` card accent. The stack was stopped with `make down`; the orchestrator should restart it (`make up && make seed`) for the live try-out. Seed `alice@example.com` / `alice-ledger-pass`: log in, then Log out to see the notice.
- Defaults chosen beyond the spec's list, for the owner:
  - Panel and `main` split the page 50/50 from `lg`.
  - The notice is styled like the alert in green: `graphite` text on `paid-wash` with a `paid` left bar, and no icon.
  - The entrance moves the content up by spacing `4` while fading in over 700 ms; the dark ground does not animate.
- The notice text arrives one timer tick after Log in appears, so screen readers announce it. Below `lg` the form can move down once by the notice's height when the notice shows. This happens only after a confirmed log out, and AC-4 (b) is measured on direct appearances.
- The brand drawing's wrapper uses `data-illustration="brand"` (a `div`, not the `svg`), and the panel's mark and wordmark sit in a `data-brand` group. This keeps the F08 icon and graphics checks valid on /login without counting the drawing, which is not rendered below `lg`, as a broken graphic. It came from a full-suite failure at Finish (`f08-icons` "stray icon"), fixed in `cec9bc3`.
- No owner-facing seed change was needed: every UI state is reachable without an account or with `alice@example.com`.
