---
feature: F00
project: PRJ-000
round: 1
decision: approved          # approved | rejected | escalated
route_to: human-merge       # human-merge | builder | spec-writer | planner | human
reviewed: feature/F00-slug @ <commit sha>
spec_version: 1
---

<!--
Approval file, written by the Approver at
projects/<project>/reviews/<id>-<slug>/approval.md
Each new round appends a "Round N" section; the frontmatter reflects the latest round.
route_to tells the orchestrator where the feature goes next:
  approved  -> human-merge
  rejected  -> builder (implementation does not meet the spec)
            -> spec-writer (the spec is ambiguous, contradictory or impossible)
            -> planner (an ADR or the plan is wrong)
  escalated -> human
Remove these comments in real files.
-->

# Approval: <id> <title>

## Round 1

### Preconditions
| Check | Result |
|---|---|
| Security review | pass |
| Code review | pass |
| UX review | pass / not-applicable |
| UI review | pass / not-applicable |
| Checks (`make check`, `make e2e`) | pass @ <commit sha> |

### Acceptance criteria
| Criterion | Tests | Independent check | Result |
|---|---|---|---|
| AC-1 | `tests/api/test_invoices.py::test_ac1_...` | `GET /api/invoices` as account admin → 200, 24 items | pass |
| AC-2 | ... | ... | fail: see APR-1 |

### Definition of done
| Item | Result |
|---|---|
| Every criterion has tests referencing its id | pass |
| CI stages pass locally | pass |
| Migrations included and reversible | pass / not applicable |
| README updated if setup changed | pass / not applicable |
| No TODOs without a backlog item | pass |

### Findings
<!-- Only when rejected. Same fields as templates/findings.md, ids APR-N. -->

#### APR-1: <short title>
- **Severity**: blocking
- **Category**: criterion-not-met | criterion-untestable | spec-contradiction | definition-of-done | plan-conflict
- **Location**: `path/to/file.py:42` or `<screen> / <state>`
- **Criterion**: AC-N
- **Problem**:
- **Evidence**: <request and response, command output, screenshot path>
- **Suggestion**:

### Decision
<!-- 1-3 sentences: decision, where it goes and why. For escalations, the exact question the human must answer. -->

## Pull request description
<!-- Only when approved. Ready to paste into the PR. -->
