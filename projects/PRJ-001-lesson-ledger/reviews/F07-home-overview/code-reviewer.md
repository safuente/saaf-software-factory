---
feature: F07
project: PRJ-001
reviewer: code
round: 1
verdict: pass
blocking: 0
suggestions: 1
reviewed: feature/F07-home-overview @ f64fbf217de4b367c9ccdf941ddbec43bf4d6e3b
---

# Code review: F07 Home overview

## Round 1

### Previous findings
None (round 1).

### Findings

#### CODE-1: Month-summary update on mark-as-paid duplicated from SummaryPage
- **Severity**: suggestion
- **Category**: simplicity
- **Location**: `frontend/src/features/home/OldestUnpaid.tsx:55-67`, `frontend/src/features/payments/SummaryPage.tsx:93-102`
- **Criterion**: AC-3 (c)
- **Problem**: Both pages apply the same "move price between collected and pending in the cached summary" logic inline, with slightly different forms (Home uses `previous.price`, Summary uses `updated.price` with a computed delta). A third caller would copy it again.
- **Evidence**: The two `setQueryData<MonthlySummary>(summaryKey(month), ...)` blocks.
- **Suggestion**: Extract a helper next to `summaryKey` in `features/payments/api.ts` (e.g. `applyPaidChange(queryClient, month, updated, previous)`) and use it from both pages.

### Summary
Checks are on the head commit and pass (make check, e2e 195). No blocking findings. TDD order holds for AC-1 to AC-6: each `test(F07)` commit precedes its `feat(F07)` commit and contains only tests, support files and fixtures. Every AC has traceable tests. The two modified pre-existing tests are unchanged in assertions: `HomePage.test.tsx` only adds Home's fake routes, and the `f05-pages.spec.ts` checks moved verbatim into `e2e/support/pageChecks.ts` (compared line by line). No backend, OpenAPI, nginx or dependency change. The `usePendingRows` extraction keeps /pending behavior identical. Home's cache keys are nested under the existing pending, lessons and students keys, so existing invalidations refresh them. The CLAUDE.md update is documentation of this feature, not scope creep.
