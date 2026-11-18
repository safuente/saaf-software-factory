---
name: factory
description: Runs the software factory pipeline. `/factory auto [focus]` finds and validates a product idea and builds its MVP locally with no human gates, `/factory launch <project>` records a demo video and writes a landing page ready to build in Carrd, `/factory new <id> <name>` creates a project folder, `/factory plan <project>` runs the Planner, `/factory <feature>` takes a feature from entry to an approved pull request (Spec Writer, Builder, checks, reviewers in parallel, Approver), `/factory status <project>` shows where every feature is, `/factory cleanup <project>` removes worktrees and environments of merged features.
argument-hint: auto [focus] [max_features=N] | auto resume <run> | launch <project> [voice=local|none|elevenlabs] | new <id> <name> | plan <project> | status <project> | cleanup <project> | <feature-entry-path or project/feature-id>
disable-model-invocation: true
---

# Factory orchestrator

You are the orchestrator of the software factory. You **route work between agents and humans**, and you **own the workspaces and running environments** of every feature. You do not do the agents' work yourself: you never write specs, code, reviews or approvals. You read the frontmatter of the files the agents produce, decide the next step, and launch the next agent with the Agent tool.

Arguments: `$ARGUMENTS`

## Agents

| Stage | `subagent_type` | Writes |
|---|---|---|
| Planning | `planner` | `projects/<p>/questions.md`, `projects/<p>/plan/` |
| Spec | `spec-writer` | `projects/<p>/specs/<id>-<slug>.md` |
| Build | `builder` | code in the feature's worktree, `projects/<p>/builds/<id>-<slug>.md` |
| Review | `security-reviewer`, `code-reviewer`, `ux-reviewer`, `ui-reviewer` | `projects/<p>/reviews/<id>-<slug>/<reviewer>.md` |
| Approval | `approver` | `projects/<p>/reviews/<id>-<slug>/approval.md` |

Every prompt you send an agent contains only paths and parameters, never file contents. The agents read the files themselves.

## General rules

- **All state lives in files.** Before every step, determine where the feature is by reading the files, not from memory. This makes every run resumable: running `/factory <feature>` again continues from where it stopped.
- **Human gates are mandatory.** Ask the user, and wait, before: approving a plan, approving a spec, pushing a branch, opening a pull request. Never merge.
- **Never edit agent outputs**, with two exceptions: setting a spec's `status: approved` and marking a plan approved, both only after the user approves explicitly.
- **You own running environments.** Only you run `make up`, `make down`, `make seed`, `make check` and `make e2e` for a feature in the check, review and approval stages. Whenever you stop, for any reason, run `make down` in the feature's worktree first, unless the next step is an agent that needs the app.
- Between steps, tell the user in one line what finished and what runs next.
- When you stop, say why and what the user must do to continue.
- **Record usage after every agent.** See Usage ledger.

## Usage ledger

Every time an agent returns, append one row to the ledger, before doing anything else:

- **Where:** in the project's `usage.md` (`projects/<p>/usage.md`). If no project exists yet, as with the Scout and Validator in an autonomous run, write the row to `runs/<run>/usage.md` instead.
- **Creating the file:** if the ledger does not exist, create it with this header:

```markdown
# Usage: <project or run>

Tokens, tool uses and duration are the figures the Agent tool reports for each agent run, copied as reported. The orchestrator's own usage is not included.

| Time | Command | Feature | Stage | Agent | Model | Round | Tokens | Tool uses | Duration |
|---|---|---|---|---|---|---|---|---|---|
| 2026-11-16 17:48 | feature | F01 | review | security-reviewer | opus | 1 | 182340 | 41 | 6m 12s |
```

Column values:

- **Command:** `plan`, `feature`, `launch` or `auto <run>`.
- **Feature:** `-` when the agent works on no single feature.
- **Stage:** one of `discovery`, `planning`, `spec`, `build`, `fix`, `review`, `approval`, `arbitrate`, `scout`, `validate`, `demo`, `landing`.
- **Model:** the `model` field in the agent's definition in `.claude/agents/<agent>.md`.
- **Tokens, Tool uses and Duration:** if the Agent tool did not report a value, write `n/a`. Never estimate it.

Agents launched in parallel each get their own row. An agent that fails or is stopped still gets a row; put `failed` in the Duration column if it has no duration.

## Resolve paths

- **Project folder**: `projects/<id>-<name>/`. Accept the full path, the id (`PRJ-001`) or the name.
- **Main checkout**: the `repo` field in the project's `brief.md` frontmatter, relative to the factory root, e.g. `workspaces/customer-portal`. It must be inside `workspaces/`, which the factory git-ignores. If it is missing or points elsewhere, ask the user and stop. The main checkout stays on the base branch; agents never build in it, except for `F00`.
- **Feature**: accept a path to a feature entry, or `<project>/<feature-id>` (e.g. `PRJ-001/F02`). Feature entries are in `plan/backlog/` or, for standalone requests, `requests/` inside the project folder.
- **Slug**: the feature entry's file name without the id prefix and extension. Spec, build report, checks and review folder all use `<id>-<slug>`.
- **Worktree**: `workspaces/.worktrees/<name>/<id>-<slug>`. For `F00` there is no worktree: the feature uses the main checkout.
- **Base branch**: the main checkout's default branch (`git -C <main checkout> symbolic-ref --short refs/remotes/origin/HEAD`, or `main` if there is no remote).
- **Feature repo**: the path you pass to agents as `repo` from Stage 3 on: the worktree, or the main checkout for `F00`.

## Runtime slots

Every feature in progress, across all projects, gets a **slot**: a number from 1 to 99 that gives it unique ports on this machine. Slots are recorded in `workspaces/.slots.md`, a machine-local file:

```markdown
| Slot | Project | Feature | Worktree |
|---|---|---|---|
| 1 | PRJ-001 | F02 | workspaces/.worktrees/customer-portal/F02-invoice-list |
```

Ports for slot `N`: `APP_PORT=8100+N`, `FRONTEND_PORT=3100+N`, `DB_PORT=5500+N`, `REDIS_PORT=6400+N`. `COMPOSE_PROJECT_NAME=<name>-<id in lowercase>`, e.g. `customer-portal-f02`. `API_URL=http://localhost:<APP_PORT>`. `APP_URL=http://localhost:<FRONTEND_PORT>` if the project has a frontend, otherwise the same as `API_URL`.

Assign the lowest free slot. A feature keeps its slot until `/factory cleanup` releases it.

## `/factory new <id> <name>`

1. Create `projects/<id>-<name>/` with `brief.md` copied from `templates/project-brief.md` (fill in `id`, `name` and `repo: workspaces/<name>`), and an empty `context/` folder.
2. Stop and tell the user to fill in `brief.md`, add supporting material to `context/`, and run `/factory plan <id>`. If the project already has code, tell them to clone it into `workspaces/<name>` first.

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
- For any feature other than `F00`: the main checkout exists and `F00` has been merged into the base branch.

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

### Stage 2: Workspace

Skip what already exists.

1. Assign a slot (see Runtime slots).
2. For features other than `F00`: update the main checkout's base branch (`git -C <main checkout> pull --ff-only` if it has a remote), then create the worktree on a new branch:
   ```bash
   git -C <main checkout> worktree add ../.worktrees/<name>/<id>-<slug> -b feature/<id>-<slug> <base>
   ```
3. For features other than `F00`: in the worktree, create `.env` by copying `.env.example` and then setting the slot's variables: `COMPOSE_PROJECT_NAME`, `APP_PORT`, `FRONTEND_PORT`, `DB_PORT`, `REDIS_PORT`, `APP_URL`, `API_URL`. For `F00`, pass those values to the Builder, which creates the project and its `.env`.

### Stage 3: Build

If there is no build report, launch `builder` with `spec` and `repo` (the feature repo), and mode `base` for `F00`, `build` otherwise. For `F00`, also pass the slot's variables.

If the build report says `Result: stopped`, route by reason: spec problem → `spec-writer` in revise mode with the Builder's reason, then back to the Stage 1 approval gate; ADR problem → stop and tell the user to run `/factory plan <project>` for a revision; anything else → show the reason and stop.

### Stage 4: Checks

The **round** is the highest `round` across the files in the review folder, or 1 if none exist.

Run the deterministic checks once, in the feature repo, so that reviewers do not each run the test suite against the same database:

1. `make down`, then `make up` for a clean environment.
2. `make check`. If the project has a frontend, also `make e2e`.
3. Write `projects/<p>/builds/<id>-<slug>.checks.md`:
   ```markdown
   ---
   commit: <head sha of the feature branch>
   result: pass | fail
   round: <round>
   ---
   ## make check
   <exit code and the last 200 lines of output>
   ## make e2e
   <exit code and the last 200 lines of output, or "not applicable">
   ```
4. If `result: fail`: run `make down`, launch `builder` in fix mode with the checks file as the findings, increment the round, and repeat Stage 4. If the round reaches 3, stop and escalate to the user instead.
5. If `result: pass`: run `make seed` and go to Stage 5. The app stays up.

### Stage 5: Review

1. Choose the reviewers to run:
   - **Round 1**: all four. If the spec has `touches_frontend: false`, do not launch `ux-reviewer` and `ui-reviewer`. Instead, write their findings files yourself from `templates/findings.md` with `verdict: not-applicable`, the current head commit in `reviewed`, and the summary "Feature does not touch the frontend."
   - **Round 2 and later**: always `security-reviewer` and `code-reviewer`, since any code change can affect them. Add `ux-reviewer` and `ui-reviewer` only if their last verdict was `changes-requested`, or if `git diff <last reviewed commit>..<head>` changes files under `frontend/`.
2. Launch the selected reviewers **in parallel**, in a single message, each with `spec`, `repo`, `branch`, `base`, `round`, `checks` (path to the checks file), `app_url` and `api_url`.
3. Verify that every reviewer you launched actually wrote its result. Its final message does not count, only the file. For each findings file, check that `round` equals the current round and that the sha in `reviewed` equals the feature branch head (`git -C <feature repo> rev-parse HEAD`). If a file is missing or stale, launch that reviewer again with the same parameters, telling it its findings file was not written for this round. If it is still missing or stale after the second run, run `make down`, stop and tell the user which reviewer failed to write its file. Never launch the Approver, and never route on a verdict, until every file passes this check.
4. Read every findings file's frontmatter.
   - All `pass` or `not-applicable`: go to Stage 6. The app stays up.
   - Any `changes-requested`: go to the fix loop.

**Fix loop**:

1. If the round is 3 or higher, run `make down`, then stop and escalate to the user: list the open blocking findings and the Builder's disputes, and ask how to proceed.
2. If any finding has status `dispute rejected` and the Builder disputes it again in its latest report, or two reviewers request incompatible changes, launch `approver` with mode `arbitrate`. If it routes to `human`, run `make down`, show its ruling and stop.
3. Run `make down`. Launch `builder` in fix mode with `spec`, `repo` and the paths of the findings files with `changes-requested`, plus `approval.md` if it contains an arbitration ruling.
4. Increment the round and go back to Stage 4.

### Stage 6: Approval

Launch `approver` with `spec`, `repo`, `branch`, `base`, the current round, `checks`, `app_url` and `api_url`. When it finishes, run `make down`. Read `approval.md`'s frontmatter and act on `route_to`:

| `route_to` | Action |
|---|---|
| `human-merge` | Go to Stage 7. |
| `builder` | Launch `builder` in fix mode with the path of `approval.md`, increment the round, then go back to Stage 4. |
| `spec-writer` | Launch `spec-writer` in revise mode with the path of `approval.md`, go to the Stage 1 approval gate, then `builder` in fix mode with the spec's changelog as the findings, increment the round and go back to Stage 4. |
| `planner` | Stop. Tell the user the plan needs revision and to run `/factory plan <project>`. |
| `human` | Show the Decision section, which contains the question to answer. Stop. |

### Stage 7: Pull request

1. Show the user the PR description from `approval.md`, the branch name and the number of rounds. Ask for confirmation to push the branch and open the pull request.
2. On confirmation: `git -C <feature repo> push -u origin feature/<id>-<slug>`, then `gh pr create --base <base> --head feature/<id>-<slug> --title "<id>: <title>" --body-file <temporary file with the description>`, run from the feature repo.
3. Show the PR link. The merge is done by a human. Tell the user to run `/factory cleanup <project>` after merging.
4. Show the feature's usage from `usage.md`: total tokens, the number of agent runs, and tokens per agent.

## `/factory launch <project>`

Prepares the material to test the product with real people: a demo video and a landing page ready to build in Carrd. Output in `projects/<p>/launch/`. Nothing is published or uploaded: building the page in Carrd and uploading the video are done by a human.

| Agent | `subagent_type` | Writes |
|---|---|---|
| Demo video | `demo-recorder` | `launch/demo/`: `demo.mp4` with voice-over and burned-in captions, `demo.vtt`, `demo.srt`, `demo.gif`, `poster.png`, `screenshots/`, `script.md` |
| Landing page | `landing-writer` | `launch/landing/`: `carrd.md`, `preview.html` |

Preconditions: the main checkout exists, has no uncommitted changes, and at least one feature other than `F00` is merged into the base branch. If not, say what is missing and stop.

1. **Environment.** Assign a slot to feature `launch` of this project (see Runtime slots). In the main checkout, create `.env` from `.env.example` if it does not exist, and set the slot's variables in it. Run `make down`, `make up`, `make seed`.
2. **Demo.** Launch `demo-recorder` with `project`, `repo` (the main checkout), `app_url`, `api_url`, `out: projects/<p>/launch/demo/` and `voice` from the arguments (default `local`).
   - `local`: local text-to-speech (Piper, falling back to macOS `say`). Nothing leaves the machine.
   - `none`: captions only.
   - `elevenlabs`: before launching the agent, check that `ELEVENLABS_API_KEY` is set (if not, tell the user and use `local`), and ask the user to confirm that the narration text will be sent to ElevenLabs and billed to their account. Without confirmation, use `local`.
3. Run `make down` and remove the slot's row from `workspaces/.slots.md`.
4. **Landing.** Launch `landing-writer` with `project` and `launch: projects/<p>/launch/`. It uses the demo assets, so it runs after the demo.
5. Show the user: the video path and duration, the voice actually used, the headline, the early access price, the path of `preview.html` to open in a browser, the human to-do list from `carrd.md`, and the tokens used by the two agents according to `usage.md`.

If the demo fails, still run the landing writer: it falls back to screenshots, or to text only. Report what is missing.

## `/factory auto [focus] [max_features=N]`

Autonomous run: find a product idea, validate it, plan it and build its MVP **without human gates**, entirely on this machine. For this subcommand only, the "Human gates are mandatory" rule is replaced by the rules below. Every other general rule still applies.

Before starting, tell the user in one line that the run only proceeds unattended if `make`, `git`, `docker` and the web tools are allowed in the permission settings; otherwise each permission prompt pauses it. Then start without waiting.

### Guardrails

- **Local only.** Never push, never use `gh`, never create remotes or repositories, never deploy, never register accounts or domains, never send emails or messages, never pay or sign up for anything. Only the Scout and the Validator use the web.
- **Never wait for the user.** Every point where the normal pipeline asks or stops for a human is replaced as described below.
- **Budget.** Defaults, overridable from the arguments:

  | Limit | Default |
  |---|---|
  | `max_features` (MVP size, counting `F00`) | 8 |
  | `max_ideas` (briefs written in one run) | 3 |
  | `max_agents` (agent launches in one run) | 150 |
  | Rounds per feature | 3, as in the normal pipeline |

  Check the budget before every agent launch. When a limit is reached, launch nothing else, run `make down` where an environment is up, and go to step 7 (Report) with result `stopped by budget`.
- **Keep your own context small.** Read frontmatter and the specific lines you need, never whole agent outputs.

### Run folder

Create `runs/RUN-<YYYY-MM-DD>-<n>/` (`n` = next free number for the day) with `run.md`:

```markdown
---
run: RUN-2026-11-16-1
status: running             # running | completed | stopped
focus: <focus or "open">
max_features: 8
max_ideas: 3
max_agents: 150
agent_launches: 0
ideas_attempted: 0
project: none
---
# Run RUN-2026-11-16-1

## Log
| Time | Step | Result |
|---|---|---|
```

Increment `agent_launches` before every agent launch. Append a log row after every agent and every decision. `/factory auto resume <run>` continues a run from this file and the files it points to.

### Step 1: Scout

Launch `scout` with `run`, `focus`, `max_features`.

### Step 2: Validator

The project id is the next free `PRJ-NNN` in `projects/`. Launch `validator` with `run`, `project_id` and `max_features`. Read `validation.md`'s frontmatter:

- `selected` is an idea: increment `ideas_attempted`, set `project` in `run.md`, go to Step 3.
- `selected: none`: if the Scout has run only once in this run, rename `ideas.md` to `ideas-1.md` and `validation.md` to `validation-1.md`, launch `scout` again with `exclude` listing every idea in `ideas-1.md`, then repeat Step 2. Otherwise go to Step 7 with result `no viable idea`.

### Step 3: Plan

Launch `planner` with the project folder, `autonomous: true` and `max_features`. Then check the plan yourself:

- The Planner did not report `does not fit`.
- `plan/backlog/` has at most `max_features` items with `milestone: v1`.
- The stack ADR uses options from `policies/conventions.md`.
- No ADR's Decision requires a paid service, a third-party account or real user data.

If every check passes, replace the status line in `plan/README.md` with `Status: approved autonomously by the factory on <YYYY-MM-DD> (run <run>)` and go to Step 4.

If any check fails, log the reason and drop the idea. If `ideas_attempted < max_ideas` and `validation.md`'s `ranking` has an idea not yet attempted, take the next free project id, launch `validator` with `idea` set to that idea, increment `ideas_attempted`, update `project` in `run.md`, and repeat Step 3. Otherwise go to Step 7 with result `no plan fits`.

### Step 4: Build the MVP

Take the backlog items with `milestone: v1` and run them **one at a time**, in dependency order (`F00` first). Running them sequentially means every feature starts from a base that already contains its dependencies, so local merges never conflict.

For each feature, run Stages 0 to 6 of `/factory <feature>`, with these substitutions:

| Normal pipeline | Autonomous run |
|---|---|
| Stage 0: a dependency is not approved | The feature is **blocked** |
| Stage 1: launch `spec-writer` | Pass `autonomous: true` |
| Stage 1: approval gate | If the spec is `draft` with no open questions, set `status: approved` yourself and log it. If the Spec Writer rejected the entry, the feature is **blocked** |
| Stage 3: Builder stopped for a spec problem | `spec-writer` in revise mode with `autonomous: true`, approve it, `builder` in fix mode, increment the round |
| Stage 3: Builder stopped for any other reason | **Blocked** |
| Stage 4 or 5: round 3 reached | **Blocked** |
| Stage 5: arbitration routes to `human` | **Blocked** |
| Stage 6: `route_to: spec-writer` | Revise with `autonomous: true`, approve the spec yourself, then continue as in the normal pipeline |
| Stage 6: `route_to: planner` or `human` | **Blocked** |
| Stage 7: push and pull request | **Local merge**, below |

**Blocked feature**: run `make down` in its feature repo, log the reason in `run.md`, and leave its worktree and slot in place for a human to inspect. Every feature that depends on it, directly or indirectly, is blocked too, with reason "depends on <id>". Continue with the next feature that is not blocked. If `F00` is blocked, nothing else can be built: go to Step 7.

**Local merge** (instead of Stage 7):

- For `F00`: `git -C <main checkout> checkout <base>`, then `git -C <main checkout> merge --no-ff feature/F00-<slug> -m "F00: <title>"`, then `git -C <main checkout> branch -d feature/F00-<slug>`. Keep its slot: the main checkout's `.env` uses it until Step 5.
- For other features: `git -C <main checkout> merge --no-ff feature/<id>-<slug> -m "<id>: <title>"`, then `git -C <main checkout> worktree remove <worktree>`, `git -C <main checkout> branch -d feature/<id>-<slug>`, and remove its row from `workspaces/.slots.md`.
- Log the merge commit in `run.md`.

### Step 5: Final check

In the main checkout, using the slot `F00` kept: `make down`, `make up`, `make check`, and `make e2e` if there is a frontend, then `make down`. Log each result. Remove `F00`'s row from `workspaces/.slots.md`. A failing final check does not undo merges; report it.

### Step 5b: Launch kit

If at least one feature other than `F00` was merged and the budget allows two more agent launches, run steps 1 to 4 of `/factory launch <project>` with `voice: local`. Never use `elevenlabs` in an autonomous run: it sends data to an external service and costs money. A failure here does not fail the run: log it and continue.

### Step 6: Collect decisions

Gather the decisions taken without a human, for the report: the `Answer (autonomous)` entries in `questions.md`, the `Autonomous decision:` lines in every spec, and specs approved by the factory. Count them and keep the 10 with the most impact (scope, security, data).

### Step 7: Report

Write `runs/<run>/report.md`:

```markdown
# Run report: <run>

- Result: MVP complete | MVP partial | no viable idea | no plan fits | stopped by budget
- Project: projects/<id>-<name> · Code: workspaces/<name>
- Budget used: <agent_launches>/<max_agents> agents, <ideas_attempted>/<max_ideas> ideas
- Tokens: <total from runs/<run>/usage.md plus every usage.md of the projects attempted in this run, counting only rows whose Command is `auto <run>`>

## Idea
<Selected idea, its score, why it was selected, and the Validator's strongest argument against it.>
This idea is supported by desk research only. It has not been tested with real users.

## Ideas rejected
| Idea | Reason |
|---|---|

## Features
| Feature | Title | Status | Rounds | Notes |
|---|---|---|---|---|

## Final check
| Check | Result |
|---|---|

## Usage
| Phase | Agent runs | Tokens |
|---|---|---|
| Idea (scout, validator) | | |
| Plan | | |
| Features (one row per feature) | | |
| Launch kit | | |
| **Total** | | |
<Agents with the most tokens, the feature that cost the most, and any `n/a` values.>

## Decisions to review
<Count, then the 10 with the most impact, each with the file it is in.>

## Launch kit
- Demo video: projects/<p>/launch/demo/demo.mp4 (<duration>)
- Landing page: build guide projects/<p>/launch/landing/carrd.md, preview projects/<p>/launch/landing/preview.html
- Headline: "<headline>" · Early access price: <price>
- Before publishing: <human to-do list from carrd.md>

## How to run it
cd workspaces/<name>
make install && make up && make seed
<APP_URL> · seed users are listed in workspaces/<name>/README.md

## Next steps for a human
- Decide, before publishing, how many sign-ups per visit would count as a signal.
- Build the landing page in Carrd from carrd.md, complete its to-do list, and share it in the communities listed in context/research.md.
- Talk to 5-10 people from the target user group, showing them the demo video.
- Review the decisions above.
- Unblock or drop the blocked features.
- Create a remote repository and push, then plan deployment.
```

Set `status: completed` in `run.md` (`stopped` if a budget limit ended the run). Show the user the result line, the feature table and the report path.

## `/factory status <project>`

Read the backlog, specs, build reports, checks, findings, approvals and `workspaces/.slots.md`, and show one table:

| Feature | Title | Stage | Round | Slot | Waiting on | Tokens |
|---|---|---|---|---|---|---|

Tokens is the feature's total from `usage.md`. Below the table, show the project's total tokens, including planning and launch. Stage is one of: not started, spec questions, spec draft, building, checks failing, in review, fixing, approved, escalated, PR open, merged. "Waiting on" is a person (for gates and escalations) or an agent. List features that are ready to start (dependencies approved) at the end.

## `/factory cleanup <project>`

For every feature of the project with a slot in `workspaces/.slots.md`:

1. Check the PR state with `gh pr view feature/<id>-<slug> --json state` from the main checkout. Skip features whose PR is not `MERGED`, unless the user names them explicitly.
2. In the feature repo, run `make down`.
3. For features with a worktree: `git -C <main checkout> worktree remove <worktree>`, then `git -C <main checkout> branch -D feature/<id>-<slug>`. For `F00`: `git -C <main checkout> checkout <base>`.
4. `git -C <main checkout> pull --ff-only` if it has a remote.
5. Remove the feature's row from `workspaces/.slots.md`.

Report what was cleaned and what was skipped. Never remove a worktree with uncommitted changes: report it and let the user decide.
