---
feature: F03
project: PRJ-001
reviewer: code
round: 1
verdict: pass
blocking: 0
suggestions: 1
reviewed: feature/F03-monthly-summary-and-payments @ 519d18c50f1ff052a74ebd3f98e34e6e0f466ec1
---

# Code review: F03 Monthly summary and payments

## Round 1

### Findings

#### CODE-1: AC-4 and AC-5 tests never failed first
- **Severity**: suggestion
- **Category**: tdd
- **Location**: commits `21d21f2` (test AC-4), `1ed17c7` (test AC-5)
- **Criterion**: AC-4, AC-5
- **Problem**: Both test commits have no following `feat(F03): AC-4/5` commit; their messages say they pass with the AC-3 and AC-1..AC-3 implementation. They come after the code that satisfies them, so there is no red-then-green evidence for these criteria.
- **Evidence**: `git log --reverse`: `2b8408f feat AC-3` precedes `21d21f2 test AC-4`. Each commit touches only tests. The behavior (strict `SetPaidRequest`, 404 scoping by `teacher_id`, month pattern) is real and covered.
- **Suggestion**: Accepted as is, since the implementation is one endpoint. In future, write the AC-4/5 tests before the PATCH implementation, or note the deviation in the build report.

### Summary
Checks are on the head commit and pass (backend 99% coverage, e2e 35 passed). Endpoints, error format and validation match the spec. Queries are teacher-scoped, totals are aggregated in SQL, lists are bounded at 500, and the existing `ix_lesson_teacher_id_date_id` index covers month and teacher queries. No migration is needed, no new dependencies, and traceability for AC-1..AC-6 exists in backend and frontend tests. Test commits precede feat commits for AC-1, 2, 3 and 6. I read the backend diff in full and the summary page, `PaidButton`, `api.ts` and `month.ts`. I did not read `PendingPage.tsx` or the test bodies.
