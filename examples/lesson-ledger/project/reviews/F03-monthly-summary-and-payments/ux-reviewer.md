---
feature: F03
project: PRJ-001
reviewer: ux
round: 1
verdict: pass
blocking: 0
suggestions: 1
reviewed: feature/F03-monthly-summary-and-payments @ 519d18c50f1ff052a74ebd3f98e34e6e0f466ec1
---

# UX review: F03 Monthly summary, pending payments, mark as paid

## Round 1

### Findings

#### UX-1: No way back after a mistaken "Mark as paid" on /pending
- **Severity**: suggestion
- **Category**: destructive-actions
- **Location**: `/pending` / success
- **Criterion**: AC-3 (spec chose no undo on /pending)
- **Problem**: The row disappears and the message gives no hint that "Undo paid" exists on the Monthly summary. A user who clicks the wrong row has to work out where to undo it.
- **Evidence**: `scratchpad/uxrev/a-pending-marked.png`: message reads "Marked Zoe Park's lesson on Sep 5, 2026 as paid. Total pending: $1,397.50." with no link or pointer.
- **Suggestion**: Add a link to the lesson's month on /summary to the message (e.g. "Undo it from Monthly summary"), without changing the announced text required by AC-3 if that must stay exact.

### Summary
Flow, states, feedback and copy match the spec on the running app. Tested as a fresh `ux-a` teacher (mark/undo on both pages, previous/next with Back, invalid month, empty month, slow load, load failure plus "Try again", 500 and 404 on mark, no session redirect), `ux-empty` (empty pending and summary) and read-only carol (truncation messages). Focus moved correctly: next row on /pending, same button on /summary and after errors. Seed states are present for empty, many items and mixed months. I did not touch alice's data. Her current data no longer matches the README seed (9 pending, 4 lessons in September), so a reseed was likely not run after other reviewers' runs. Screenshots are in `/private/tmp/claude-501/-Users-saaf-workspace-saaf-software-factory/1970f24f-a397-48d4-a233-ca6562813eac/scratchpad/uxrev/`.
