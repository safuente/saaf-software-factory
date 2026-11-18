# Review process

Rules shared by every reviewer agent: Security, Code, UX and UI. Each reviewer's own file defines what it looks for; this file defines how every review works.

## Input

The caller gives you:

- `spec`: path to the approved spec.
- `repo`: path to the feature's worktree, under `workspaces/.worktrees/`, with the feature branch checked out.
- `branch`: the feature branch, e.g. `feature/F02-invoice-list`.
- `base`: the branch it will merge into, usually the default branch.
- `round`: review round number, starting at 1.
- `checks`: path to the checks file, with the results of `make check` and `make e2e` on the current commit.
- `app_url`, `api_url`: the running app for this feature, already started and seeded.

Read: the spec, the sections of `policies/conventions.md` your own file names, the ADRs listed in the spec, the build report in `projects/<project>/builds/<id>-<slug>.md`, the checks file, and the diff. Read code as described in Context economy.

## Context economy

Everything you read stays in your context and is sent again on every later turn. Read what your review needs, in this order:

1. **The shape of the change**: `git -C <repo> diff --stat <base>...<branch>` and `git -C <repo> log --oneline <base>..<branch>`.
2. **The diff of the files in your domain.** Pass the paths: `git -C <repo> diff <base>...<branch> -- <paths>`. UX and UI read frontend files; Security reads entry points, auth, data access and dependency files; Code reads all of it. Skip lock files, generated files and snapshots, except for the dependency changes you check in lock files.
3. **Surrounding code only when the diff calls it or is called by it**, found with Grep and read by line range (`offset` and `limit`), not whole files.
4. **The checks file holds the test and lint results.** Do not reproduce them.

Filter long command output (`| tail -40`, `| grep ...`). For scanners, read the summary and the findings at or above medium severity, not the full report.

The repo is under `workspaces/`, which the factory git-ignores: always pass the repo path explicitly to Glob and Grep. Searches from the factory root do not see project code. Run git commands with `git -C <repo>`.

## Boundaries

- **You do not change code.** You never edit, create or delete files in `repo`, and never commit, checkout other branches, stash, reset or push. Use git only to read: `diff`, `log`, `show`, `blame`.
- **You do not run the test suite, and you do not start, stop or restart the app or its containers.** The orchestrator ran the tests once (see `checks`) and keeps the app running at `app_url` for all reviewers at the same time. Running `make test`, `make up`, `make down`, `make seed` or `docker compose` yourself would break the other reviewers' work.
- Bash is for reading and for static checks that need no database or running app: linters and scanners.
- **The app is shared with the other reviewers while you work.** Log in with the seed users listed in the repo's `README.md`. Do not delete or modify seed records; when you need to change data, create your own records first.
- Temporary files and scripts go to a temporary directory, never inside `repo`.
- The only file you write is your findings file: `projects/<project>/reviews/<id>-<slug>/<reviewer>.md`, using the format in `templates/findings.md`.

If `app_url` is not reachable and your review needs it, do not try to start the app. Review from the code and the tests only, say so in your Summary, and do not mark as blocking anything you could not confirm in the code.

## Scope

- Review **the diff and what it affects**. Problems in code the feature does not touch are out of scope. Report them only if the feature makes them worse or depends on them, and as suggestions marked "pre-existing".
- Stay in your domain. Other reviewers cover the rest:

| Reviewer | Owns |
|---|---|
| Security | Vulnerabilities, authentication, authorization, data exposure, secrets, dependencies with known vulnerabilities |
| Code | Correctness, structure, conventions, performance, tests and TDD evidence, migrations |
| UX | Flows, task completion, screen states, error recovery, copy, interaction feedback |
| UI | Visual consistency, design system use, responsive layout, accessibility (WCAG 2.2 AA) |
| Approver | Whether every acceptance criterion is met |

If you notice something clearly serious outside your domain, mention it in your Summary in one line. Do not create a finding for it.

## Severity

- **blocking**: must be fixed before merge. Use it only when you can state a concrete consequence: a bug, an exploit, a user who cannot complete a task, a violation of the spec, an ADR or `policies/conventions.md`.
- **suggestion**: improves the code or product but is not required. The Builder may decline.

When in doubt, it is a suggestion. A review with many weak blocking findings sends the feature around the loop for nothing.

## Evidence

Every blocking finding needs evidence that someone else can check: the code excerpt and why it fails, the request that exposes the bug, the command output, the screenshot path. "This might be a problem" is not a blocking finding. Verify it or downgrade it.

## Rounds

- **Round 1**: full review of the diff.
- **Round 2 and later**: the Builder has responded. Read the fix section of the build report.
  1. For each previous finding, record its status: resolved, unresolved, dispute accepted (the Builder's argument is right) or dispute rejected (it is not, and you say why).
  2. Review only what changed since your previous round: `git -C <repo> diff <previous reviewed sha>..<branch>`, taking the sha from the `reviewed` field of your findings file. Do not re-read the full diff. Do not re-review unchanged code looking for new issues you missed before, unless they are blocking.
- Keep finding ids stable across rounds. New findings get the next free number.

## Verdict

- `pass`: no open blocking findings.
- `changes-requested`: at least one open blocking finding, including rejected disputes.
- `not-applicable`: the feature is outside your domain, e.g. UX or UI on a feature with `touches_frontend: false`. Write the file with this verdict and a one-line summary, and stop.

Update the frontmatter counts and verdict to reflect the latest round. Finish by reporting the verdict, the counts and the most important finding.

**The findings file is your only output that counts.** The orchestrator reads the file, not your final message. Before you finish, write or update it with `round` set to the current round and `reviewed` set to the head sha you reviewed (`git -C <repo> rev-parse <branch>`), even when the verdict is `pass` and nothing changed since your previous round. A review whose file still shows an earlier round or sha is treated as not done, and you will be run again.
