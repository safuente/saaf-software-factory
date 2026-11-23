# Retrospective: Lesson Ledger pilot

What the pilot says about the factory, and what to change first. Sources: [project/usage.md](project/usage.md) (115 agent runs), [project/metrics.md](project/metrics.md) and [project/pilot-notes.md](project/pilot-notes.md). Token figures exclude the orchestrator's own usage.

## Summary

The factory delivered a working, well-tested app: 10 features, 60 acceptance criteria and 7.38M tokens. Its reviewers never raised a false blocking finding. The waste came from three places:

1. **Product and design mistakes caught after merge.** Two features' look was replaced, and Home stayed empty until the owner noticed. This cost about 2.36M tokens, 32% of the total.
2. **Extra rounds.** Runs after round 1 cost 2.05M tokens, 28%.
3. **A fixed pipeline for every change.** Pure frontend changes paid for a full security review, and the builder's cost per feature grew with the size of the repository's agent notes.

The pipeline's structure works: state in files, separate roles, isolated worktrees and measurement. The changes below are about where control and judgment sit, not about replacing it.

## Where the tokens went

| Stage | Runs | Tokens | Share |
|---|---|---|---|
| Review (4 reviewers) | 63 | 2,419,321 | 32.8% |
| Build | 10 | 2,251,994 | 30.5% |
| Approval | 15 | 1,049,078 | 14.2% |
| Spec | 11 | 739,966 | 10.0% |
| Fix | 9 | 587,376 | 8.0% |
| Planning and discovery | 7 | 332,485 | 4.5% |

| Agent | Model | Runs | Tokens | Per run | Share | Blocking findings |
|---|---|---|---|---|---|---|
| builder (build and fix) | opus | 19 | 2,839,370 | 149,441 | 38.5% | - |
| approver | opus | 15 | 1,049,078 | 69,939 | 14.2% | 5 (2 defects, 3 test gaps) |
| spec-writer | opus | 11 | 739,966 | 67,270 | 10.0% | - |
| code-reviewer | sonnet | 18 | 695,569 | 38,643 | 9.4% | 2 |
| ui-reviewer | sonnet | 14 | 612,543 | 43,753 | 8.3% | 2 |
| security-reviewer | opus | 17 | 582,552 | 34,268 | 7.9% | 1 |
| ux-reviewer | sonnet | 14 | 528,657 | 37,761 | 7.2% | 1 |
| planner | opus | 7 | 332,485 | 47,498 | 4.5% | - |

## What the data shows

1. **The most expensive errors were product decisions, and no agent could catch them.**
   - F04 and F05 (1,743,610 tokens) built a look that the owner rejected after merge. F06 replaced it for another 1,003,926.
   - Home stayed a placeholder from F01 to F06 and needed F07 (616,689).
   - Every spec was met and every review passed. The specs simply described the wrong thing (pilot findings 15 and 17).
   - The owner found both problems by using the app, outside any gate.
2. **Round 1 is cheap, and later rounds are not.**
   - A feature that passes first time costs 470k to 650k tokens. Six of the ten features did.
   - The four that did not cost 3.66M between them, and their rounds after the first account for 2.05M.
   - The causes were:
     - test or seed gaps that the approver rejected while the software already worked (F00, F02);
     - unstable end-to-end tests (F05);
     - a race that escaped from F03 (F05);
     - criteria that the end-to-end tests checked too weakly (F06).
3. **The approver earns its cost.** It is 14% of tokens and raised 5 of the 11 blocking findings, including the only product defects caught before merge (F06 Log out position and a missing label). Three of its five rejections were test gaps that a code reviewer could have found a stage earlier.
4. **The security reviewer adds little on frontend-only work.** Across F04 to F09, which made no backend changes, it cost 301,730 tokens and found no blocking issue. Its one useful suggestion (a dependency published the same day) is something a deterministic check could enforce.
5. **Builder cost grows with the repository, not with the feature.**
   - First-round builds cost 170k to 193k tokens in F01 and F03, and 249k to 284k in F07 to F09, with the same 6 criteria each.
   - The repository's `CLAUDE.md` grew from 904 to 1,476 words between F05 and F09. Every agent loads it on every run.
6. **Orchestration errors come from rules that live in a prompt.**
   - The orchestrator skipped a required UX re-review in F05, which cost an approver rejection and a round.
   - Several practices exist only as orchestrator habit, not in `SKILL.md`:
     - local merge for projects without a remote (finding 4);
     - the screenshot gate (finding 15);
     - pre-authorised approvals;
     - filling in usage rows after the notification arrives (finding 11).
7. **Human gates rarely change the outcome at the moment they run.** Plan approval: 0 of 6. Spec approval: 1 of 10. Merge: 0 of 9. The two big course corrections happened after merge.
8. **Most pilot findings are still open in the factory.** Of findings 1 to 17, a search of the agent, skill and policy files finds only 1, 6 and 7 addressed. Finding 16 was fixed in the project, not in the factory.

## Changes, in priority order

| # | Change | Evidence | Expected effect |
|---|---|---|---|
| 1 | **Gate the design and the content before the build.** For frontend features, the spec lists, per page, what the user sees and does. A cheap static mockup or prototype screenshot is approved by the owner before the Builder starts. The planner checks that every page in the plan has real content by v1. | Findings 15 and 17. F04/F05 rework and F07 cost about 2.36M (32%) | Removes the largest cost class. The merge gate becomes a confirmation, not the first look |
| 2 | **Move pipeline control into a script.** A `factory next <feature>` command reads the files and prints the next action: round, reviewers chosen from the diff, frontmatter verification, slots, usage rows. It also gets local merge mode and the screenshot gate. The LLM only launches agents and talks to the owner. | F05 stale review; findings 1, 4, 11 and 15; 9 unplanned interventions | No skipped rules, resumable without reading the conversation, smaller orchestrator context |
| 3 | **Choose reviewers from the diff.** Run the security reviewer only when backend code, dependencies, configuration, headers or authentication change. Otherwise run deterministic checks: dependency audit, minimum release age, CSP diff. | 301,730 tokens and 0 blocking findings across F04 to F09 | About 4% of tokens on frontend work, with no loss of findings |
| 4 | **Move "tests prove the criterion as written" to round 1.** The code reviewer checks test strength per criterion, and the spec names the seed state each criterion needs. | 3 of 5 approver rejections were test or seed gaps (findings 2 and 8). Rounds after the first cost 28% | Fewer late rounds |
| 5 | **Keep builder context flat.** Hold `CLAUDE.md` to a short index and move per-area rules (styling, motion, payments) into `docs/` files that are read only when touched. During TDD the builder runs only the affected tests and the full suite once. Track builder tokens per criterion. | Builder is 38.5% of tokens. First-round builds rose about 45% as `CLAUDE.md` grew 63% | Builder cost stops growing with project age |
| 6 | **Handle flaky tests by policy.** In Stage 4, rerun a failing test once. If it passes, record it as flaky in the checks file and in `metrics.md` and open a fix item, instead of a fix round. | F05 round 1 and the F08 login timing test (finding 16) | No rounds spent on infrastructure noise |
| 7 | **Spend human time where it changes outcomes.** Fold plan approval into the design gate (change 1). Keep the merge gate only for visual changes (screenshots and the live app) and for anything that leaves the machine. | Gates changed the outcome 1 time in 25 | Less owner time, same control |
| 8 | **Measure before tuning further.** Run experiment 4, the baseline: an F09-sized feature built by a single Claude Code session and reviewed the same way. Run experiment 2, seeded defects, to measure reviewer recall. | No baseline exists; reviewer recall is unknown | Shows whether the pipeline's cost buys quality, and which reviewers to keep |
| 9 | **Offer validation for hand-made projects.** `/factory new` can run the Validator on the brief, optionally and with confirmation, since it uses the web. | This project reached 10 features on fixture research | Avoids building unvalidated products |

## How to tell whether a change worked

Use [project/metrics.md](project/metrics.md) as the template for the next project, plus two new columns:

- **Builder tokens per criterion.** Target: flat over the project's life (change 5).
- **Owner corrections after merge.** Target: 0 (change 1).

The other targets are:

- Rounds after round 1 below 15% of tokens (changes 4 and 6).
- No orchestrator interventions (change 2).
- A first baseline comparison recorded under Experiments (change 8).

## Open items in the product

These are non-blocking suggestions, left as they were at the end of the pilot:

- Mobile tables need sideways scrolling to reach price and action (F07 UI-1).
- Student names wrap at 375 px (F06 UI-1).
- The F09 illustration looks small on 1920 px screens (F09 UI-1).
- `lucide-react` should be pinned to a release at least a few days old (F08 SEC-1).
- There is no way to edit or delete a student or lesson, and no password recovery. Both are needed before real use.
