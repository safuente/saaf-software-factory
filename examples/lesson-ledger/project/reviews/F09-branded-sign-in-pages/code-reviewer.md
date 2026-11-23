---
feature: F09
project: PRJ-001
reviewer: code
round: 1
verdict: pass
blocking: 0
suggestions: 1
reviewed: feature/F09-branded-sign-in-pages @ cec9bc3b5a028f5af3a2dbdc4689f45cfef39f4b
---

# Code review: F09 Branded sign-in pages

## Round 1

### Findings

#### CODE-1: Test edits inside `feat` commits
- **Severity**: suggestion
- **Category**: tdd
- **Location**: commits `545cc54` and `6743880`
- **Criterion**: AC-1, AC-4
- **Problem**: The `feat` commits also edit tests (`f09-signed-out.spec.ts`, `signedOutPages.test.tsx`, `f08-motion.spec.ts`, `f06-shell.spec.ts`, `f08-brand.spec.ts`).
- **Evidence**: `git show 545cc54 -- frontend/e2e/f09-signed-out.spec.ts` shows the selector change `svg[data-illustration=brand]` to `svg[data-brand-illustration]` plus prettier reflow. `git show 6743880 -- frontend/e2e/f08-motion.spec.ts` changes the token probe and the animated-element selector. None of these weakens an assertion, and the f06/f08 edits are the ones AC-6 (a) allows. Every criterion still has a `test(F09)` commit before its `feat(F09)` commit, and each `test` commit contains only tests.
- **Suggestion**: Keep test changes in `test(...)` commits next time.

### Summary
Checks are `pass` on the current head (cec9bc3): backend 323 passed, 1 skipped, frontend 493 passed, e2e 276 passed, coverage 99%. TDD order, traceability and scope hold up. The one-shot in-memory notice flag is set only on a 204, taken once inside a timer so StrictMode does not consume it, and uses no storage, URL or cookie. The theme tokens are added in the existing theme, and `LogoMark` and the page hooks are extracted rather than duplicated. No blocking findings.
