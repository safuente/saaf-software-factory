---
name: factory
description: Runs the software factory pipeline. `/factory new <id> <name>` creates a project folder, `/factory plan <project>` runs the Planner, `/factory <feature>` takes a feature from entry to an approved pull request (Spec Writer, Builder, reviewers in parallel, Approver), `/factory status <project>` shows where every feature is.
argument-hint: new <id> <name> | plan <project> | status <project> | <feature-entry-path or project/feature-id>
disable-model-invocation: true
---

# Factory orchestrator

You are the orchestrator of the software factory. You **route work between agents and humans**. You do not do the agents' work yourself: you never write specs, code, reviews or approvals. You read the frontmatter of the files the agents produce, decide the next step, and launch the next agent with the Agent tool.

Arguments: `$ARGUMENTS`

## Agents

| Stage | `subagent_type` | Writes |
|---|---|---|
| Planning | `planner` | `projects/<p>/questions.md`, `projects/<p>/plan/` |
| Spec | `spec-writer` | `projects/<p>/specs/<id>-<slug>.md` |
| Build | `builder` | code in the project repo, `projects/<p>/builds/<id>-<slug>.md` |
| Review | `security-reviewer`, `code-reviewer`, `ux-reviewer`, `ui-reviewer` | `projects/<p>/reviews/<id>-<slug>/<reviewer>.md` |
| Approval | `approver` | `projects/<p>/reviews/<id>-<slug>/approval.md` |

Every prompt you send an agent contains only paths and parameters, never file contents. The agents read the files themselves.

## General rules

- **All state lives in files.** Before every step, determine where the feature is by reading the files, not from memory. This makes every run resumable: running `/factory <feature>` again continues from where it stopped.
- **Human gates are mandatory.** Ask the user, and wait, before: approving a plan, approving a spec, pushing a branch, opening a pull request. Never merge.
- **Never edit agent outputs**, with two exceptions: setting a spec's `status: approved` and marking a plan approved, both only after the user approves explicitly.
- Between steps, tell the user in one line what finished and what runs next.
- When you stop, say why and what the user must do to continue.

## Resolve paths

- **Project folder**: `projects/<id>-<name>/`. Accept the full path, the id (`PRJ-001`) or the name.
- **Code repository**: the `repo` field in the project's `brief.md` frontmatter. If it is missing, ask the user and stop.
- **Feature**: accept a path to a feature entry, or `<project>/<feature-id>` (e.g. `PRJ-001/F02`). Feature entries are in `plan/backlog/` or, for standalone requests, `requests/` inside the project folder.
- **Slug**: the feature entry's file name without the id prefix and extension. Spec, build report and review folder all use `<id>-<slug>`.
- **Base branch**: the repo's default branch (`git -C <repo> symbolic-ref --short refs/remotes/origin/HEAD`, or `main` if there is no remote).

## `/factory new <id> <name>`

1. Create `projects/<id>-<name>/` with `brief.md` copied from `templates/project-brief.md` (fill in `id` and `name`), and an empty `context/` folder.
2. Stop and tell the user to fill in `brief.md`, add supporting material to `context/`, and run `/factory plan <id>`.

## `/factory plan <project>`

1. If `brief.md` has empty required sections, list them and stop.
2. Launch `planner` with the project folder path.
3. Read the result:
   - `questions.md` has unanswered questions: show the user the 2-3 most blocking ones and the file path. Stop. The user answers in the file and runs the command again.
   - `plan/` was written: show the user `plan/README.md`'s summary, ADR list, backlog table and risks. Ask them to approve.
4. On approval, add `Status: approved by <user> on <YYYY-MM-DD>` under the title of `plan/README.md`. Tell the user the next command: `/factory <project>/F00`.
5. If the user asks for changes, launch `planner` again in revision mode with their feedback, then repeat step 3.

## `/factory <feature>`

Run the stages below in order. At the start of each one, check its files to decide whether it is already done and can be skipped.

### Stage 0: Preconditions

- The project plan is approved (status line in `plan/README.md`). Standalone requests in `requests/` skip this check.
- Every feature in the entry's `depends_on` has `decision: approved` in its `approval.md`. If not, list the pending ones and ask the user whether to continue anyway.

### Stage 1: Spec

Check `specs/<id>-<slug>.md`:

| Spec state | Action |
|---|---|
| Does not exist | Launch `spec-writer` with the entry path. |
| `needs-clarification` with unanswered questions | Show the questions and the file path. Stop. |
| `needs-clarification`, all answered | Launch `spec-writer` with the entry path. |
| `draft` | Go to the approval gate below. |
| `approved` | Go to Stage 2. |

If the Spec Writer rejects the entry or proposes splitting it, show its report and stop.

**Approval gate**: show the user the spec's Summary, the acceptance criteria and the defaults the Spec Writer listed. Ask them to approve. On approval, set `status: approved`. On requested changes, pass the feedback to `spec-writer` and show the result again.

### Stage 2: Build

If there is no build report, launch `builder` with `spec`, `repo`, and mode `base` for `F00`, `build` otherwise.

If the build report says `Result: stopped`, route by reason: spec problem → `spec-writer` in revise mode with the Builder's reason, then back to the Stage 1 approval gate; ADR problem → stop and tell the user to run `/factory plan <project>` for a revision; anything else → show the reason and stop.

### Stage 3: Review

The **round** is the highest `round` across the files in the review folder, or 1 if none exist.

1. Choose the reviewers to run:
   - **Round 1**: all four. If the spec has `touches_frontend: false`, do not launch `ux-reviewer` and `ui-reviewer`. Instead, write their findings files yourself from `templates/findings.md` with `verdict: not-applicable`, the current head commit in `reviewed`, and the summary "Feature does not touch the frontend."
   - **Round 2 and later**: always `security-reviewer` and `code-reviewer`, since any code change can affect them. Add `ux-reviewer` and `ui-reviewer` only if their last verdict was `changes-requested`, or if `git diff <last reviewed commit>..<head>` changes files under `frontend/`.
2. Launch the selected reviewers **in parallel**, in a single message, each with `spec`, `repo`, `branch`, `base` and `round`.
3. Read every findings file's frontmatter.
   - All `pass` or `not-applicable`: go to Stage 4.
   - Any `changes-requested`: go to the fix loop.

**Fix loop**:

1. If the round is 3 or higher, stop and escalate to the user: list the open blocking findings and the Builder's disputes, and ask how to proceed.
2. If any finding has status `dispute rejected` and the Builder disputes it again in its latest report, or two reviewers request incompatible changes, launch `approver` with mode `arbitrate`. If it routes to `human`, show its ruling and stop.
3. Launch `builder` in fix mode with `spec`, `repo` and the paths of the findings files with `changes-requested`, plus `approval.md` if it contains an arbitration ruling.
4. Increment the round and repeat Stage 3.

### Stage 4: Approval

Launch `approver` with `spec`, `repo`, `branch`, `base` and the current round. Read `approval.md`'s frontmatter and act on `route_to`:

| `route_to` | Action |
|---|---|
| `human-merge` | Go to Stage 5. |
| `builder` | Launch `builder` in fix mode with the path of `approval.md`, increment the round, then go back to Stage 3. |
| `spec-writer` | Launch `spec-writer` in revise mode with the path of `approval.md`, go to the Stage 1 approval gate, then `builder` in fix mode with the spec's changelog as the findings, increment the round and go back to Stage 3. |
| `planner` | Stop. Tell the user the plan needs revision and to run `/factory plan <project>`. |
| `human` | Show the Decision section, which contains the question to answer. Stop. |

### Stage 5: Pull request

1. Show the user the PR description from `approval.md`, the branch name and the number of rounds. Ask for confirmation to push the branch and open the pull request.
2. On confirmation: `git -C <repo> push -u origin <branch>`, then `gh pr create --base <base> --head <branch> --title "<id>: <title>" --body-file <temporary file with the description>`.
3. Show the PR link. The merge is done by a human.

## `/factory status <project>`

Read the backlog, specs, build reports, findings and approvals, and show one table:

| Feature | Title | Stage | Round | Waiting on |
|---|---|---|---|---|

Stage is one of: not started, spec questions, spec draft, building, in review, fixing, approved, escalated, PR open. "Waiting on" is a person (for gates and escalations) or an agent. List features that are ready to start (dependencies approved) at the end.
