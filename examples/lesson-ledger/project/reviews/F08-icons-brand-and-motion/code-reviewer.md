---
feature: F08
project: PRJ-001
reviewer: code
round: 1
verdict: pass
blocking: 0
suggestions: 0
reviewed: feature/F08-icons-brand-and-motion @ 7bac4f31a5d3771c81e5e7ae3cb5d77d024ea697
---

# Code review: F08 Icons, brand and motion

## Round 1

### Previous findings
None (round 1).

### Findings
None.

### Summary
Checks file matches the head sha and passes (make check, make e2e; the one flaky F01 timing test is unrelated, F08 touches no backend). TDD order holds: each of AC-1 to AC-5 has a `test(F08)` commit before its `feat(F08)` commit; AC-6 tests were green on arrival, which the build report discloses. The only pre-existing test changed, `theme.test.ts`, is made stricter (new Icons and Motion tables, `ease` namespace), nothing weakened. The implementation is small and in the right layer: one `Icon` map, `Button`/`ActionLink` `icon` prop with the icon omitted while pending, `Brand`, `Illustration`, CSS-only motion utilities inside `prefers-reduced-motion: no-preference`, highlight state kept in `SummaryRow` and set only on mark success. The load animations are keyed to mount, so in-place updates do not replay them. `lucide-react` is exact-pinned and justified. No scope creep and no API, data or migration change.
