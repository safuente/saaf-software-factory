---
feature: F07
project: PRJ-001
reviewer: ux
round: 1
verdict: pass
blocking: 0
suggestions: 2
reviewed: feature/F07-home-overview @ f64fbf217de4b367c9ccdf941ddbec43bf4d6e3b
---

# UX review: F07 Home overview

## Round 1

### Findings

#### UX-1: Empty "Oldest unpaid lessons" still offers "View all pending payments"
- **Severity**: suggestion
- **Category**: navigation
- **Location**: `/` / partially empty (1 student, 0 lessons) and all paid
- **Criterion**: none
- **Problem**: When nothing is pending, the section shows "Nothing pending." and still links to a page that will be empty. The same applies to "View all lessons" with "No lessons recorded yet.".
- **Evidence**: /private/tmp/claude-501/-Users-saaf-workspace-saaf-software-factory/1970f24f-a397-48d4-a233-ca6562813eac/scratchpad/ux/partial-1280.png and allpaid.png. The link is visible under the empty message.
- **Suggestion**: Hide these links when the list is empty, or keep them if the owner wants the shortcut constant.

#### UX-2: Success announcement stays on screen as unlabeled text
- **Severity**: suggestion
- **Category**: feedback
- **Location**: `/` / success after Mark as paid
- **Criterion**: AC-3 (b)
- **Problem**: The `role="status"` text ("Marked Zed Test's lesson on Nov 3, 2026 as paid. Total pending: $270.00.") renders as plain bold text between the two sections and stays until the next action. After several marks it describes an older lesson than the one the user just acted on, and it can look like a stray line.
- **Evidence**: /private/tmp/claude-501/-Users-saaf-workspace-saaf-software-factory/1970f24f-a397-48d4-a233-ca6562813eac/scratchpad/ux/mark-success.png
- **Suggestion**: Clear it after a few seconds, or place it right above the table next to the total line. This matches F03 behaviour, so it is optional.

### Summary
The flow works end to end as alice, bob, carol and my own ux- teachers. Verified in the running app:
- **Default and many items:** figures match the spec, 5 rows per table.
- **Get started:** appears for the new teacher.
- **Partially empty and all paid:** messages match the spec.
- **Loading and load error:** the "Try again" retry recovers, and the title row stays.
- **Mark as paid:** the button shows "Saving…", and the figures and total update without a reload. The announcement plays and focus moves. The 5xx and 404 alerts keep the row and focus on the button. Focus goes to the section `h2` when the table empties.
- **Quick actions:** both navigate correctly.

No blocking findings. Screenshots are in `/private/tmp/claude-501/-Users-saaf-workspace-saaf-software-factory/1970f24f-a397-48d4-a233-ca6562813eac/scratchpad/ux/`.
