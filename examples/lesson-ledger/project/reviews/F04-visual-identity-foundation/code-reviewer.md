---
feature: F04
project: PRJ-001
reviewer: code
round: 1
verdict: pass
blocking: 0
suggestions: 1
reviewed: feature/F04-visual-identity-foundation @ 791df5a65a809a141aacf9877d9bea7b548f8c27
---

# Code review: F04 Visual identity and Tailwind foundation

## Round 1

### Findings

#### CODE-1: AC-1 doc parser lives in production source tree
- **Severity**: suggestion
- **Category**: structure
- **Location**: `frontend/src/shared/styles/designDocParser.ts`
- **Criterion**: none
- **Problem**: A test-only helper (markdown table parser for `docs/design.md`) sits next to production styles, not beside the tests that use it.
- **Evidence**: only imported by `designDoc.test.ts` and `theme.test.ts`.
- **Suggestion**: rename to `*.testSupport.ts` or move under `src/test/`.

### Summary
Checks are on the head commit and pass (make check, make e2e). TDD order holds: every AC has a test-only commit before its feat commit (AC-1, AC-2/3, AC-5, AC-6). No pre-existing test file was modified (only additions in the diff against main), so AC-4 assertions are intact. Every criterion id appears in test names. Pages use only shared components, no API/data/scope changes, the dependencies are justified in the build report, and legacy CSS used by F05 pages is kept as the spec says.
