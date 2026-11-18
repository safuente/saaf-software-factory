---
feature: F02
project: PRJ-001
reviewer: ux
round: 2
verdict: pass
blocking: 0
suggestions: 3
reviewed: feature/F02-students-and-lessons @ 1c86b0cf9c0e7b1bd2f4d619d9e0ef3468c6761a
---

# UX review: F02 Students and recording lessons

## Round 1

### Findings

#### UX-1: Success message stays after the user starts the next entry
- **Severity**: suggestion
- **Category**: feedback
- **Location**: `/lessons` and `/students` / success
- **Criterion**: none
- **Problem**: "Lesson recorded." / "Student added." remains visible while the user types the next entry, so it can be read as confirmation of the new, unsaved data.
- **Evidence**: Playwright as `ux-*` teacher: after recording a lesson, typing in Duration still shows `[role=status]` = "Lesson recorded." Screenshot: `/private/tmp/claude-501/-Users-saaf-workspace-saaf-software-factory/1970f24f-a397-48d4-a233-ca6562813eac/scratchpad/shots/ux-lessons-success.png`. The message clears only on the next submit (`LessonsPage.tsx` `onSubmit`).
- **Suggestion**: Clear the status when any field changes.

#### UX-2: Newly recorded lesson is not highlighted
- **Severity**: suggestion
- **Category**: feedback
- **Location**: `/lessons` / success
- **Criterion**: none
- **Problem**: On a long table (alice has 12 rows) the new row appears at its sorted position with no cue. The user must find it themselves to confirm what was saved.
- **Evidence**: Same flow; the status says only "Lesson recorded." without student or amount.
- **Suggestion**: Include the student and date in the message, e.g. "Lesson recorded for Zoe Park on Nov 17, 2026."

### Summary
Every state in the spec's UI section was reached and screenshotted (loading, load error, submit error, 404, empty, no students, field errors, success, logged-out redirect) in `/private/tmp/claude-501/-Users-saaf-workspace-saaf-software-factory/1970f24f-a397-48d4-a233-ca6562813eac/scratchpad/shots/`. Copy, focus, input retention after failure, and double-submit protection all match the spec, so there are no blocking findings. Only two small feedback suggestions.

## Round 2

Changes since 88309e2: lessons table wrapped in a focusable scroll region, nowrap on Date and Price cells (UI-1/UI-2 fixes). No UX-domain change otherwise.

### Previous findings
| Id | Status | Note |
|---|---|---|
| UX-1 | unresolved | Suggestion; the Builder did not address it. Not required. |
| UX-2 | unresolved | Suggestion; the Builder did not address it. Not required. |

### Findings

#### UX-3: Price and Status columns are cut off at 375px with no visible cue
- **Severity**: suggestion
- **Category**: task-completion
- **Location**: `/lessons` / default at 375px wide
- **Criterion**: none
- **Problem**: After the UI-1 fix the table scrolls inside its region, but the Price column is clipped and Status is fully hidden. Nothing hints that the table scrolls sideways, so a phone user may never see the price or "Unpaid".
- **Evidence**: Playwright as alice at 375px: region `scrollWidth` 476 vs `clientWidth` 343; page-level overflow 0. Screenshot: `/private/tmp/claude-501/-Users-saaf-workspace-saaf-software-factory/1970f24f-a397-48d4-a233-ca6562813eac/scratchpad/shots/ux2-375.png`.
- **Suggestion**: Add a scroll cue (edge shadow or a short hint), or tighten padding and column widths so Price fits. Optionally stack the rows on narrow screens.

### Summary
The UI-review fix works: no page-level horizontal scroll at 375px, and the table region is keyboard-reachable. No blocking findings. New suggestion UX-3: Price and Status are hidden without a scroll cue on phones.
