# Build report: F03 Monthly summary, pending payments, mark as paid

- Spec: projects/PRJ-001-lesson-ledger/specs/F03-monthly-summary-and-payments.md (version 1)
- Repo: workspaces/.worktrees/lesson-ledger/F03-monthly-summary-and-payments
- Branch: feature/F03-monthly-summary-and-payments (16 commits on `main` at baae4d0; base unchanged, no rebase needed)
- Mode: build
- Result: complete

## Criteria
| Criterion | Tests | Status |
|---|---|---|
| AC-1 | backend/tests/test_monthly_summary.py (all `test_ac1_*`); frontend/src/features/payments/SummaryPage.test.tsx ("AC-1 monthly summary", "Main navigation"); e2e/f03-payments.spec.ts "AC-1 summary of the browser's month…" | passing |
| AC-2 | backend/tests/test_pending_lessons.py (all `test_ac2_*`); frontend/src/features/payments/PendingPage.test.tsx; e2e/f03-payments.spec.ts "AC-2 AC-3 pending list…" | passing |
| AC-3 | backend/tests/test_mark_paid.py `test_ac3_*`; frontend/src/features/payments/MarkPaid.test.tsx; e2e/f03-payments.spec.ts "AC-2 AC-3 pending list…" | passing |
| AC-4 | backend/tests/test_mark_paid.py `test_ac4_*` (idempotency, 422 bodies, 415, non-integer id) | passing; already passed with the AC-3 implementation (test committed alone) |
| AC-5 | backend/tests/test_payments_isolation.py (all `test_ac5_*`); test_isolation.py all-routes test now asserts the F03 routes; e2e "AC-5 another teacher's lessons…" | passing; already passed with the AC-1..AC-3 implementation (test committed alone) |
| AC-6 | backend/tests/test_seed_ledger.py (updated `_assert_seeded_state`, `test_f03_ac6_*`); frontend/src/features/payments/Failures.test.tsx; e2e "AC-6 load and mark failures, and many items"; e2e/f02-isolation-and-seed.spec.ts F03 seed checks | passing (UI failure tests already passed with the AC-3 implementation; seed tests were red first) |
| Non-functional p95 | backend/tests/stack/test_payments_performance.py (5,000 lessons, summary and pending page_size=500) | passing |
| Non-functional a11y / widths | e2e/f03-payments.spec.ts: axe on /summary default, empty, error and /pending default, empty, error; no horizontal scroll at 1280 and 768 px | passing |

## Checks
| Stage | Command | Result |
|---|---|---|
| Install, lint, typecheck, test, build, scan | `make check` | pass; backend 323 passed (1 skipped, pre-existing), coverage 99%; frontend 239 passed, coverage 98% |
| E2E | `make e2e` | pass, 35 tests |
| Seed twice | `make seed` x2 | pass |

## Changes
- New dependencies: none
- Migrations: none (spec: no schema change; month and unpaid queries use the existing `ix_lesson_teacher_id_date_id`)
- New endpoints: `GET /api/monthly-summaries/{month}`, `GET /api/pending-lessons`, `PATCH /api/lessons/{lesson_id}`; `GET /api/lessons` gains `month`. OpenAPI and `schema.d.ts` regenerated.
- Seed: alice has 3 paid lessons (current-month day 2; previous-month $60.00 day 3 and $1,250.00 day 10). carol's 520 unpaid lessons now all fall in the current month, between day 1 and today, so `/summary` reaches its "Many items" state as well as `/pending`. README seed section updated with the F03 states.
- Tests changed rather than added:
  - `backend/tests/test_seed_ledger.py::_assert_seeded_state`: no longer asserts "all unpaid"; asserts the exact paid/unpaid split per month (F03 Behavior: Seed says F02's seed test is updated).
  - `frontend/e2e/f02-isolation-and-seed.spec.ts` alice test: 3 Paid / 9 Unpaid instead of 12 Unpaid (same reason).
  - `backend/tests/test_openapi.py`: path set includes the F03 paths.
  - `frontend/src/features/students/StudentsPage.test.tsx` Main navigation: adds the two F03 links (F03 Behavior: Pages).
  - `SummaryPage.test.tsx` invalid-month case for `""`: before green I corrected an assertion in my own new test that expected the wrong value for the empty string.
- Test helpers: `src/test/api.ts` supports a `"*"` fallback route; `src/test/renderApp.tsx` also renders `location.search`; `src/test/ledger.ts` has `paymentRoutes`, an in-memory fake of the F03 endpoints.

## Open issues
- In the e2e tests every F03 case uses its own teachers. The alice/bob seed checks are read-only and run in the existing F02 seed spec, which already calls `make seed`. Nothing in F03 depends on carol: the "Many items" e2e cases build their own 500+ lessons. The known CODE-3 race, where F01's AC-1 deletes carol while another spec calls `make seed`, is not made worse.
- Undo results: after "Mark as paid" or "Undo paid", the page shows totals worked out from the response. It then refreshes from the server, as the spec's "Mark / undo" describes.
- The 404 "That lesson could not be found" state is in the README, reachable by re-running `make seed` while a page is open (lesson ids change).
