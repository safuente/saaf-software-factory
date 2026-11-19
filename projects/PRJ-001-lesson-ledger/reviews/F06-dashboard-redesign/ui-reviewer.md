---
feature: F06
project: PRJ-001
reviewer: ui
round: 3
verdict: pass
blocking: 0
suggestions: 2
reviewed: feature/F06-dashboard-redesign @ 84158b59cb96bc26723c7099bf36208c7b745f7a
---

# UI review: F06 Dashboard redesign of every page and the app shell

## Round 2

This is the first UI review of F06 (round 2 only because Stage 4 checks failed once), so there are no previous findings.

### Findings

#### UI-1: Student names wrap to two lines below 640 px
- **Severity**: suggestion
- **Category**: responsive
- **Location**: `/lessons`, `/summary` at 375 px; `StudentName.tsx` (`sm:whitespace-nowrap`)
- **Criterion**: none
- **Problem**: In the pinned Student column the name wraps ("Dev / Patel"), so every row is two lines tall on phones. That works against the dense-table direction, though nothing is clipped.
- **Evidence**: `/private/tmp/claude-501/-Users-saaf-workspace-saaf-software-factory/1970f24f-a397-48d4-a233-ca6562813eac/scratchpad/ui/f06r2/lessons-375.png`, `summary-375.png`.
- **Suggestion**: Accept it, or shrink the initials circle and its gap on phones so more names fit on one line.

#### UI-2: Pending bar segment has low contrast against white
- **Severity**: suggestion
- **Category**: a11y-contrast
- **Location**: `MetricsPanel.tsx`, `pending-bar` (#E8A33D, 2.16:1 on canvas)
- **Criterion**: AC-4 (b), AC-6
- **Problem**: The segment is below 3:1, but the bar is `aria-hidden` and the same figures appear as text ("25% paid · 75% pending"), so WCAG 1.4.11 is met. It is not a failure.
- **Evidence**: `docs/design.md` palette table states the ratio and the reason. The text equivalent is visible in `summary-1280.png`.
- **Suggestion**: Optionally darken the amber to 3:1 or more so the bar also reads well for low-vision users.

### Checked and found fine
- Screenshots of all seven pages at 375, 768 and 1280 px, plus `/summary` at 320 px. There is no horizontal page scroll, overlap or clipping. Wide tables scroll inside their region with the Student column kept visible.
- axe-core (wcag2a, wcag2aa, wcag21aa, wcag22aa and best-practice tags) reports 0 violations on all five app pages at 375, 768 and 1280 px, and on `/login` and `/signup` at 1280 px.
- Keyboard: the focus ring is visible on row buttons (`focus-all.png`). The sidebar and Log out contrast values come from the design plan and match the theme hex values.
- Design system: no arbitrary values or literal colours in components. The hex values appear only in the `@theme` block. The `initials` and `check-mark` utilities use theme variables. There is no new duplicated component: `Button`, `Table`, `StudentName`, `PaymentStatus` and `MetricsPanel` are shared. No animation or transition was added, so reduced motion is not affected.
- Design match: the dark sidebar, white main area, large title, black primary and outlined secondary buttons, grey headers, initials circles, worded status, month chip and right-hand metrics panel all follow `design-reference.png` and ADR-006. Search, filters and checkboxes are left out, as the spec states.
- Merge gate: the owner's approval of the look on the 14 screenshots remains a separate step outside this review.

### Summary
No blocking findings. The redesign meets WCAG 2.2 AA in everything I could check by scan and screenshot, is responsive at 320 to 1280 px, and uses theme tokens and shared components throughout. Only two minor suggestions: wrapped names on phones, and a low-contrast bar segment that is backed by text.

## Round 3

Reviewed `89f5d66..84158b5` (sidebar column fill, grey "Your students" label, docs/design.md).

### Previous findings
| Id | Status | Note |
|---|---|---|
| UI-1 | dispute accepted (stays a suggestion) | Builder declined; it was a non-blocking suggestion. Left for the owner. |
| UI-2 | unresolved (suggestion) | Unchanged; the bar is aria-hidden and backed by text. |

### Findings
No new findings.

### Checked
- Log out at the sidebar's bottom: at 1280 px on `/lessons` (page 1308 px tall) the header bottom is 1308 and Log out's bottom is 1276 (32 px padding). On 800 px pages it is 800 and 768. Below 1024 px it stays in the top bar (154/142 at 375, 65/53 at 768). Screenshots: `scratchpad/ui/f06r3/lessons-1280.png`, `students-1280.png`.
- "Your students" label: computed colour rgb(91, 98, 109) on white is 6.15:1, above 4.5:1. It is still a level-2 heading, so semantics are unchanged.
- axe-core (wcag2a/aa/21aa/22aa, best-practice): 0 violations on `/`, `/lessons`, `/students`, `/summary`, `/pending` at 375, 768 and 1280 px, and on `/login` and `/signup` at 1280 px. No horizontal scroll at any width.
- Only Tailwind utilities and existing theme tokens were added; no arbitrary values.

### Summary
No blocking findings. Both round 3 changes are confirmed in the running app, and the grey label passes contrast. Two suggestions remain open (UI-1, UI-2).
