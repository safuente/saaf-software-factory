---
feature: F05
project: PRJ-001
reviewer: ux
round: 4
verdict: pass
blocking: 0
suggestions: 1
reviewed: feature/F05-restyle-remaining-pages @ 738b029bdd3f7fbb5d3028c0208dfc522994339b
---

# UX review: F05 Restyle the remaining pages

## Round 3

Scope: changes since f1eaf0c. UX-2 verified fixed. UX-1 stays open as a suggestion, accepted by the owner.

### Findings

#### UX-1: Primary row action is off-screen on phones with no cue that the table scrolls
- **Severity**: suggestion
- **Category**: task-completion
- **Location**: `/pending` and `/summary` at 375 px, default state
- **Criterion**: none
- **Problem**: Unchanged from round 2. The Action column sits right of the fold with no scroll cue. Accepted by the owner as is.
- **Evidence**: .../ux/alice-375-pending.png
- **Suggestion**: A "Scroll sideways" hint or edge fade.

#### UX-2: Caption scrolls out of view with the table (resolved)
- **Status**: fixed in f55ef43
- **Verified**: at 320 and 375 px, after focusing the first "Mark as paid" button, the caption ("Lessons in November 2026, newest first", "Unpaid lessons, oldest first") stays visible. The table rests on whole columns after the pinned Student column: at 375 px /summary shows Student, Status, Action, with no cut-off cell. The focused button is fully in view with its ring uncut at 320 and 375 px on both pages.
- **Evidence**: /private/tmp/claude-501/-Users-saaf-workspace-saaf-software-factory/1970f24f-a397-48d4-a233-ca6562813eac/scratchpad/ux/r3/320-summary-focus.png, 320-pending-focus.png, summary-paid.png

### Summary
On a fresh `ux-r3-*` account, mark and undo on /summary announce "Marked as paid. Collected: $60.00, pending: $1,295.00." and "Marked as unpaid. Collected: $0.00, pending: $1,355.00.". Focus lands on the toggled button each time. On /pending, each mark announces the lesson and the new total, and focus moves to the next row's button. After the last row, focus moves to the h1 and the page shows "Nothing pending. Every lesson is paid." No regressions found.

## Round 4

Scope: changes 3d76aee..738b029 (scroll-margin-bottom on table regions, useWholeColumns tests, one more e2e viewport).

### Previous findings
| Id | Status | Note |
|---|---|---|
| UX-1 | unresolved, suggestion, accepted by owner | No change. |
| UX-2 | resolved | Re-checked, no regression. |

### Findings
None new.

### Summary
Tabbing through /lessons, /students, /summary and /pending as alice at 375x667, 320x568 and 667x375: the tab order is unchanged, and every table region receives focus and scrolls into view. Short regions (/summary) now end 9 px above the viewport bottom at 375x667 (bottom 658 of 667) and 150 px or more clear at 320x568, so the focus ring is not cut off. Taller regions (/lessons, /pending) are aligned by their top edge and fill the viewport as before. No keyboard or scroll regression. Screenshots: /private/tmp/claude-501/-Users-saaf-workspace-saaf-software-factory/1970f24f-a397-48d4-a233-ca6562813eac/scratchpad/ux/r4/.
