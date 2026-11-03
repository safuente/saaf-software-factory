---
feature: F00                # feature id
project: PRJ-000
reviewer: security          # security | code | ux | ui
round: 1                    # increments every time the Builder fixes and the review runs again
verdict: changes-requested  # pass | changes-requested | not-applicable
blocking: 0                 # number of open blocking findings
suggestions: 0              # number of open suggestions
reviewed: feature/F00-slug @ <commit sha>
---

<!--
Findings file. One per reviewer per feature, at
projects/<project>/reviews/<id>-<slug>/<reviewer>.md
Each new round appends a "Round N" section; the frontmatter always reflects the latest round.
verdict is "pass" only when blocking is 0.
Remove these comments in real files.
-->

# <Reviewer> review: <id> <title>

## Round 1

### Previous findings
<!-- From round 2 on: status of every finding from the previous round. -->
| Id | Status | Note |
|---|---|---|
| SEC-1 | resolved / unresolved / dispute accepted / dispute rejected | |

### Findings

#### SEC-1: <short title>
- **Severity**: blocking | suggestion
- **Category**: <reviewer-specific category, e.g. authorization, n+1-query, empty-state, contrast>
- **Location**: `path/to/file.py:42` or `<screen> / <state>`
- **Criterion**: AC-N | none
- **Problem**: <what is wrong, in one or two sentences>
- **Evidence**: <how you know: code excerpt, request and response, command output, screenshot path, exploit scenario>
- **Suggestion**: <what would fix it; the Builder decides how>

### Summary
<!-- 1-3 sentences: overall assessment and the most important finding. -->
