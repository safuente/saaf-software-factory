# Pilot notes: PRJ-001 Lesson Ledger

First end-to-end run of the factory: plan, then F00 to F03 through spec, build, checks, review, approval and a local merge. Dates: 2026-11-16 to 2026-11-18. Source data: `usage.md`, `reviews/*/`, `builds/*`.

## Results

| Feature | Rounds | Agent runs | Tokens | Blocking findings that changed the code |
|---|---|---|---|---|
| Planning | - | 2 | 58,354 | - |
| F00 Project base | 3 | 16 | 647,165 | SEC-1: ports published on 0.0.0.0, database superuser reachable from the LAN |
| F01 Teacher accounts | 1 | 7 | 467,529 | none |
| F02 Students and lessons | 3 | 16 | 829,096 | UI-1: lessons table overflowed the page at 375px |
| F03 Monthly summary and payments | 1 | 7 | 469,914 | none |
| **Total** | | **48** | **2,472,058** | |

- All four features were approved and merged into `main` of `workspaces/lesson-ledger`, with no remote.
- The reviewers found 2 real defects (SEC-1 and UI-1). The other 2 extra rounds came from approver rejections over test or seed gaps while the software already worked (F00 APR-1/APR-2, F02 APR-1).
- The builder is the largest cost in each feature: 32 to 41% of its tokens, counting fix runs. A feature with no fix rounds costs about 470k tokens. Each extra round adds about 140k to 200k.
- The orchestrator's own tokens are not in these figures.

## Findings

Ordered by impact. **Fix** is the proposed change to the factory.

### High

1. **A reviewer can report a verdict without writing its findings file.** In F00 round 3 the code reviewer reported pass but did not write the file. The approver read the stale file and routed to `code-reviewer`, which cost a reviewer run and an approver run.
   - Fix: in Stage 5 the orchestrator must check that every findings file has the current `round` and the head sha in `reviewed` before Stage 6. Add "write the findings file before you finish" to the output section of each reviewer agent.
   - **Applied 2026-11-18:** Stage 5 step 3 of `SKILL.md` (verify, re-run once, then stop), `policies/review-process.md` Verdict section, and one line in each of the four reviewer agents.
2. **The approver rejects over test or seed gaps when the software meets the spec.** This happened in F00 (weak AC-1 and AC-6 tests) and F02 (`make seed` did not reach the "more than 500 items" state). It cost one full round each time, about 140k tokens in F02.
   - Fix: add a decision `approved-with-follow-ups` to the approver for gaps that are not acceptance-criterion failures. Record the follow-ups in `approval.md` and route to `human-merge`.
3. **Shared seed accounts are not protected.** Tests wipe the database, and parallel reviewers write to the same stack. In F03 the UX reviewer changed alice's lessons although its prompt said not to touch the seed accounts. Without a reseed, the approver would have checked AC-6 against modified data.
   - Fix:
     - Run `make seed` after Stage 4 and again just before Stage 6. The orchestrator did this by hand in this pilot; make it a written step.
     - In the reviewer agent definitions, give each reviewer an account prefix (`sec-`, `code-`, `ux-`, `ui-`, `apr-`) and state that seed accounts are read-only.
     - Longer term: make the seed accounts read-only at the application level in development, or give each reviewer its own database.
4. **Stage 7 assumes a GitHub remote and `gh`.** The project had neither, and the brief does not say who creates the remote. Cleanup also checks the PR state with `gh pr view`, so it cannot run.
   - Fix: add `remote: none | github` to the brief. With `none`, Stage 7 asks the user and runs `git merge --no-ff feature/<id>-<slug>` on the base branch. Cleanup then checks `git branch --merged <base>` instead of the PR state.

### Medium

5. **`route_to: code-reviewer` (and other reviewers) is not in the Stage 6 table.** The approver used it in F00. Fix: add a row: re-run the named reviewer at the current round, then re-run the approver.
6. **The F00 builder created a feature branch.** The skill says F00 builds in the main checkout on the base branch. Cleanup had to delete `feature/F00-project-base`. Fix: say "commit on the base branch, do not create a branch" in the F00 builder prompt and in `builder.md` base mode.
7. **WCAG version mismatch.** The planner and specs say WCAG 2.1 AA. `ui-reviewer.md` checks 2.2 AA. Fix: pick one version in `policies/conventions.md` and reference it from both.
8. **The default-month "many items" state forced an unrequested seed change.** In F03 the builder moved carol's 520 lessons into the current month so the summary page reaches its "many items" state. The spec did not ask for this. Fix: the spec-writer should list, for each new screen state, which seed account reaches it.
9. **An F01 test deletes a seed account.** The F01 AC-1 e2e test deletes `carol@example.com`, so `make seed` is needed after `make e2e`. Fix (in the project): use `uniqueEmail()` in that test.
10. **A changed frontend needs an image rebuild.** The frontend is served from a production build, so a running stack shows old code after a merge until `make up` runs again. The user hit this when trying the app. Fix: after a local merge, tell the user to run `make up && make seed` in the main checkout, or have the orchestrator do it.

### Low

11. **The usage figures arrive after the agent's report.** A subagent's final report comes before the notification that carries its tokens. The orchestrator wrote each row with `n/a`, then updated it. Fix: document this two-step pattern in the Usage ledger section.
12. **The Duration column is unreliable.** The F00 spec-writer shows 13h 22m, which is time spent waiting for the user's approval. Fix: document that Duration includes waiting time, or drop the column.
13. **Error copy is inconsistent.** On a network failure, the F01 login and sign-up forms show "Something went wrong. Please try again." The F02 and F03 pages show "We couldn't reach Lesson Ledger." Fix (in the project): add a follow-up item to align F01.
14. **TDD evidence is weak when one commit satisfies several criteria.** In F03, the AC-4 and AC-5 tests passed straight away against the AC-3 code (CODE-1). Fix: in that case the builder should say so in the build report, so reviewers don't flag it.

## Open non-blocking suggestions in the product

Candidates for a follow-up feature:

| Feature | Id | Suggestion |
|---|---|---|
| F01 | SEC-2 | No request size or field length limit on login and sign-up |
| F01 | CODE-3 | E2E test deletes `carol@example.com` (finding 9) |
| F01 | CODE-4 | One-time timing difference on the first login with an unknown email; concurrent logouts can return 500 |
| F01 | - | Generic error copy on network failure (finding 13) |
| F02 | CODE-1, CODE-2 | Duplicate form-error hooks; INT4 limit defined twice |
| F02 | UX-1 to UX-3 | Success message not cleared; no cue for the new row; columns hidden in the 375px scroll |
| F03 | UI-1 | "Next month" wraps below the heading at 375px |
| F03 | UX-1 | After "Mark as paid" on /pending, the message doesn't say that undo exists on Monthly summary |
| F03 | - | An instant double click sends two identical PATCH requests (harmless, the request is idempotent) |

## What worked

- Running the four reviewers in parallel took about 1 to 2 minutes of wall time per round.
- Running the checks once in Stage 4 meant reviewers did not each run the test suite.
- Per-feature slots and worktrees: F01 to F03 each ran on their own ports alongside the main stack, with no conflicts.
- Human gates: four spec approvals and four merges, each done only when the user said so.
- The security reviewer found a real exposure in F00, the database reachable from the LAN, that the checks did not catch.
- Fewer rounds over time: F01 and F03 passed in round 1, after reviewer prompt fixes made during F00.
