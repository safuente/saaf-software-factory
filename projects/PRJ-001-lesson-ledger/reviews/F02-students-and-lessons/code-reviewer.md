---
feature: F02
project: PRJ-001
reviewer: code
round: 3
verdict: pass
blocking: 0
suggestions: 3
reviewed: feature/F02-students-and-lessons @ ce82bf4507345e1c74cfb393288aa35a8c379dd8
---

# Code review: F02 Students and recording lessons

## Round 1

### Findings

#### CODE-1: Duplicate form-error hooks
- **Severity**: suggestion
- **Category**: simplicity
- **Location**: `frontend/src/shared/ui/useFormErrors.ts` and `frontend/src/features/auth/useFieldErrors`
- **Criterion**: none
- **Problem**: Two hooks now do the same job. The Builder lists this under open issues, and F01 messages are out of scope.
- **Evidence**: Build report, Open issues.
- **Suggestion**: Move login and sign-up to `useFormErrors` in a later change.

#### CODE-2: INT4 maximum defined twice
- **Severity**: suggestion
- **Category**: simplicity
- **Location**: `backend/app/students/service.py:11` (`_INT4_MAX`) and `backend/app/core/pagination.py` (`le=2**31 - 1`)
- **Criterion**: none
- **Problem**: The same bound is written in two places under different forms.
- **Evidence**: See locations.
- **Suggestion**: One shared constant, for example in `app/core`.

### Summary
Checks are green on the head commit (88309e2). Every AC has a `test(F02)` commit before its `feat(F02)` commit, the test commits contain only tests, and every AC id appears in tests. The composite FK, CHECK constraints and indexes match the spec. Default-deny auth, teacher scoping, identical 404s, bounded pagination and joined student loading (no N+1) are all correct. The two suggestions are minor, and no blocking findings.

## Round 2

### Previous findings
| Id | Status | Note |
|---|---|---|
| CODE-1 | unresolved | Suggestion, Builder declined (out of scope per build report). Still open. |
| CODE-2 | unresolved | Suggestion, not addressed. Still open. |

### Findings
No new findings. Changes since 88309e2 are the UI-1/UI-2 fix only (`LessonsPage.tsx`, `ui.module.css`, one component test, e2e accessibility spec). The `test(F02)` commit (83d47fc) precedes the `fix(F02)` commit (1c86b0c) and holds only tests. The change is markup and CSS; no logic, migration or dependency change.

### Summary
Checks are green on 1c86b0c (make check and make e2e pass). The UI fix is small, test-first and in the right layer. No blocking findings.

## Round 3

### Previous findings
| Id | Status | Note |
|---|---|---|
| CODE-1 | unresolved | Suggestion, still open. |
| CODE-2 | unresolved | Suggestion, still open. |

### Findings

#### CODE-3: F01 AC-1 e2e deletes the seeded carol account
- **Severity**: suggestion
- **Category**: tests
- **Location**: `frontend/e2e/ac1-signup.spec.ts:4-9`, `backend/app/seed.py` (`TEACHERS`)
- **Criterion**: none
- **Problem**: The AC-1 sign-up test uses `carol@example.com` and calls `forgetTeacher(CAROL)` in `beforeEach` and `afterAll`, which deletes the seed account with its 510 students and 520 lessons. The test itself still passes, because it deletes before signing up. After it runs, "Many items" is unreachable until the next `make seed`.
- **Evidence**: Today the suite ends with carol present (curl login with `carol-ledger-pass` returns 200 on the running stack) only because `ac2-login.spec.ts`, `ac3`, `ac4`, `accessibility` and `f02-isolation-and-seed` call `seed()` in `beforeAll` after ac1 in alphabetical order. Running `make e2e T=frontend/e2e/ac1-signup.spec.ts`, or any reorder or sharding that puts ac1 last, leaves carol deleted. The e2e suite also uses carol's name for a throwaway account, which now collides with a seed account.
- **Suggestion**: Change the AC-1 test to `uniqueEmail()` (already in `support/stack.ts`) or a non-seed address, so no e2e test deletes a seed account. This is a small change to F01 test data, justified by the new seed.

### Summary
Checks are green on ce82bf4. The APR-1 fix is test-first (d0878e9 contains only a test, ce82bf4 the fix). Seeding uses bulk inserts inside the existing transaction and lock, and is idempotent and reversible by reseeding. The `test_ac6_seed` change is justified in the build report and is not a weakening. The carol/F01 interaction is not blocking, but it is fragile (CODE-3). No blocking findings.
