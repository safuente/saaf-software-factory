# Metrics: PRJ-001 Lesson Ledger

How well the factory works, feature by feature. Fill in one row per table when a feature closes (merged or abandoned). Sources: `usage.md` (tokens, runs), `reviews/<feature>/` (findings, rounds), `builds/` (fix rounds, owner decisions), `pilot-notes.md` (process findings), and the owner's own use of the app (escaped defects).

Rows for F00 to F05 were filled in retroactively on 2026-11-19 from those files; F05 closed (merged) the same day.

## Definitions

- **Rounds**: the highest `round` in the feature's review folder. 1 means it passed first time.
- **Agent runs / Tokens**: rows and summed tokens for the feature in `usage.md`. The orchestrator's own tokens are not included.
- **Blocking findings** are classified by what they actually were:
  - **Defect**: the software was wrong (security hole, broken layout, race, wrong behaviour).
  - **Test gap**: the software met the spec, but tests, seed data or coverage did not show it.
  - **Noise**: the finding was wrong, or was later withdrawn.
- **Escaped defect**: a problem in a merged feature that the pipeline should have caught, found later by a reviewer of another feature or by the owner.
- **Unplanned intervention**: anything the orchestrator or the owner had to do outside the documented pipeline, such as a manual reseed, an escalation, an owner ruling on a criterion, or cleaning up after an agent.

## Per feature

All specs have 6 acceptance criteria, so tokens per criterion is tokens ÷ 6.

| Feature | Rounds | Agent runs | Tokens | Blocking: defect | Blocking: test gap | Blocking: noise | Escaped defects | Unplanned interventions |
|---|---|---|---|---|---|---|---|---|
| Planning + revisions | - | 7 | 332,485 | - | - | - | - | 0 |
| F00 Project base | 3 | 16 | 647,165 | 1 (SEC-1) | 2 (APR-1, APR-2) | 0 | 0 | 2 |
| F01 Teacher accounts | 1 | 7 | 467,529 | 0 | 0 | 0 | 2 | 0 |
| F02 Students and lessons | 3 | 16 | 829,096 | 1 (UI-1) | 1 (APR-1) | 0 | 0 | 0 |
| F03 Monthly summary and payments | 1 | 7 | 469,914 | 0 | 0 | 0 | 1 | 1 |
| F04 Visual identity foundation | 1 | 8 | 559,991 | 0 | 0 | 0 | 1 | 1 |
| F05 Restyle remaining pages | 4 | 19 | 1,183,619 | 3 (UX-2, UI-2, CODE-2) | 1 (CODE-3) | 0 | - | 5 |
| F06 Dashboard redesign | 3 | 14 | 1,003,926 | 2 (APR-1, APR-2) | 0 | 0 | - | 0 |
| F07 Home overview | 1 | 7 | 616,689 | 0 | 0 | 0 | - | 0 |
| F08 Icons, brand and motion | 1 | 7 | 650,667 | 0 | 0 | 0 | - | 0 |
| F09 Branded sign-in pages | 1 | 7 | 619,139 | 0 | 0 | 0 | - | 0 |
| **Total** | | **115** | **7,380,220** | **7** | **4** | **0** | **5** | **9** |

Notes on the table:

- F05 round 1 failed in Stage 4 (flaky `make e2e` under host load) before any review. That is an infrastructure failure, so it is not counted as a finding.
- F05 CODE-2 is the F03 PaidButton race. It is a real defect, counted in F05 where it was found, and also as an escaped defect of F03.
- F04 had no blocking findings, but its visual design was rejected by the owner after merge. That is counted as an escaped defect of F04.

## Reviewer precision

Blocking findings per reviewer across F00 to F05.

| Reviewer | Blocking findings | Defect | Test gap | Noise | Suggestions |
|---|---|---|---|---|---|
| security-reviewer | 1 | 1 | 0 | 0 | 5 |
| code-reviewer | 2 | 1 | 1 | 0 | 14 |
| ux-reviewer | 1 | 1 | 0 | 0 | 8 |
| ui-reviewer | 2 | 2 | 0 | 0 | 5 |
| approver | 5 | 2 | 3 | 0 | - |

Two readings:

- **No noise so far.** Every blocking finding pointed at something real.
- **The approver found its first product defects in F06** (APR-1 Log out position, APR-2 missing grey label), both criteria the e2e tests checked too weakly. Its three earlier rejections were test or seed gaps (pilot finding 2). Recall is not measured yet: there is no seeded-defect experiment (see Experiments).

## Escaped defects

| Found in | Escaped from | What | Found by | Cost |
|---|---|---|---|---|
| F02 review | F01 | An F01 e2e test deletes the seed account `carol@example.com` | code-reviewer (F02 CODE-3) | A reseed after every `make e2e`, and part of the F05 e2e flakiness |
| F02 to F03 use | F01 | Inconsistent network-error copy between the F01 forms and the later pages | orchestrator (pilot finding 13) | Follow-up item, not fixed |
| F05 review | F03 | Mark/undo totals race (PaidButton) makes `make e2e` fail about 1 run in 5 | code-reviewer (F05 CODE-2) | One F05 fix round, plus an owner exception to "no behaviour change" |
| After F05 build | F04 | Visual identity rejected by the owner ("horrible") | owner | F04 and F05 styling work to be redone in F06 (about 1.4M tokens) |
| After F06 merge | F06 | Home left as an empty placeholder (title and "Signed in as" only) although the screenshot gate approved it | owner | F07 (about 660k tokens incl. plan revision); pilot finding 17 |

## Unplanned interventions

| Feature | Intervention | By | Root cause (pilot finding) |
|---|---|---|---|
| F00 | The code reviewer reported pass without writing its findings file, so the reviewer and approver were re-run | orchestrator | 1 (applied) |
| F00 | Deleted the `feature/F00-project-base` branch the builder created against the rules | orchestrator | 6 |
| F03 | Reseeded before the approver after the UX reviewer changed alice's data | orchestrator | 3 |
| F04 | Owner ruling to merge with the 12.5% root-size mismatch, fixed in F05 | owner | 15 |
| F05 | Owner rulings on how to read AC-6 a and AC-6 g | owner | spec ambiguity |
| F05 | Owner exception allowing an F03 behaviour change (race fix) | owner | escaped from F03 |
| F05 | Escalation at round 3; owner allowed a 4th round (CODE-3, UI-3) | owner | coverage gap |
| F05 | Orchestrator skipped the round 4 UX review although `frontend/` changed; the approver rejected on a stale review (APR-1), costing one approver run (about 43k tokens) | orchestrator | Stage 5 rule not followed |
| F05 | E2E infrastructure fixes (global seed, 4 workers, timeouts) in a fix round | builder | 16 |

## Human gates

| Gate | Times used | Changed the outcome | Notes |
|---|---|---|---|
| Plan approval | 6 (plan, 5 revisions) | 0 | Approved as proposed each time; the F06 to F09 revisions were pre-authorised by the owner |
| Spec approval | 10 | 1 | F04 was sent back for multi-device criteria (v2) |
| Merge | 9 | 0 | F04 was merged without a visual check: the gate failed (pilot finding 15). F06 used the screenshot gate (14 screenshots, explicit "do you approve the look?") and was approved |

A gate that never changes the outcome is either working well upstream or rubber-stamping. The F04 merge was the second case.

## Experiments

Not run yet. Record each run here with its date, the factory commit and the results.

| # | Experiment | Measures | Status |
|---|---|---|---|
| 1 | **Benchmark**: 3 to 5 fixed reference features (CRUD, auth, report, UI change) in a scratch project, re-run after each major factory change | Tokens, rounds and escaped defects compared across factory versions | pending |
| 2 | **Seeded defects**: a branch with a planted IDOR, a missing label, an N+1 query, an empty test and a hardcoded colour; run only the reviewers | Recall per reviewer and category | pending |
| 3 | **Ablation**: repeat one feature without one component (UX reviewer, approver, or with a Sonnet builder) | Whether quality drops enough to justify that component's cost | pending |
| 4 | **Baseline**: the same feature built by a single Claude Code session without the pipeline, reviewed the same way | Cost, time and defects of the factory compared with no factory | pending |

## Trends to watch

- **Rounds per feature**: 3, 1, 3, 1, 1, 4, 3, 1, 1, 1. There is no clear improvement yet. F05's extra rounds came from e2e infrastructure, a defect that escaped from F03, and coverage.
- **Tokens per feature**: about 470k with no fix rounds. Each extra round adds about 140k to 200k.
- **Escaped defects per feature**: currently about 0.7. The aim is 0. The most expensive one so far was visual (F04), not functional.
