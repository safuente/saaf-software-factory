---
feature: F02
project: PRJ-001
reviewer: ui
round: 2
verdict: pass
blocking: 0
suggestions: 0
reviewed: feature/F02-students-and-lessons @ 1c86b0c
---

# UI review: F02 Students and recording lessons

## Round 1

### Findings

#### UI-1: Lessons table overflows the page at 375px (horizontal scroll)
- **Severity**: blocking
- **Category**: responsive
- **Location**: `/lessons` populated state, table `.table` in `frontend/src/shared/ui/ui.module.css`, `LessonTable` in `frontend/src/features/lessons/LessonsPage.tsx`
- **Criterion**: none (WCAG 1.4.10 Reflow; review-process rule "no horizontal page scroll at every width")
- **Problem**: With alice's seeded lessons at 375px the table is wider than the viewport, so the page scrolls horizontally and the Status column is cut off. The table has `width: 100%` but no scroll container or reflow.
- **Evidence**: Playwright as alice at 375px: `document.documentElement.scrollWidth` 432 vs `innerWidth` 375. Screenshot `/private/tmp/claude-501/-Users-saaf-workspace-saaf-software-factory/1970f24f-a397-48d4-a233-ca6562813eac/scratchpad/ui/alice_lessons-375.png` (right edge clipped at "Unpaid"); `alice_lessons_focus.png` shows "S..." for Status cut off. 768 and 1280 widths: no overflow.
- **Suggestion**: Wrap the table in a container with `overflow-x: auto` (focusable, with an accessible name) or reflow rows into stacked blocks below a breakpoint. Keeping dates on one line (`white-space: nowrap` on the Date cell) would also reduce the width and the row height.

#### UI-2: Date cells wrap onto three lines on narrow screens
- **Severity**: suggestion
- **Category**: responsive
- **Location**: `/lessons` table, Date column at 375px
- **Criterion**: none
- **Problem**: "Nov 13, 2026" breaks into "Nov / 13, / 2026", making rows tall and hard to scan.
- **Evidence**: `alice_lessons-375.png`.
- **Suggestion**: `white-space: nowrap` on the date and price cells, together with the UI-1 fix.

### Checked and fine
- Axe (wcag2a, wcag2aa, wcag21aa, wcag22aa) at 1280px: 0 violations on `/`, `/students`, `/lessons` for alice and for bob (empty students, no-students lessons), plus the field-error states on `/students` (bob) and `/lessons` (alice) at 375px.
- No horizontal scroll at 768 and 1280 on any page. No dark mode in the product (no dark tokens), so not checked.
- The new code uses F01 tokens and shared components (`TextField`, `Page`); the new `SelectField` mirrors `TextField` and is justified. No hardcoded colors or spacing in the diffed CSS.
- Focus indicator is visible on fields (screenshot `alice_lessons_focus.png`). Errors have text, not color only.
- Nav links are 18px high, below 24px, but they satisfy the WCAG 2.5.8 spacing exception (24px gaps, no other targets within the 24px circle). The "Add a student" link on `/lessons` is inline-style likewise. Not a finding.

### Summary
Accessibility scans are clean and the screens use the design system, but the populated Lessons table causes horizontal page scroll with the seeded data at 375px (UI-1, blocking).

## Round 2

### Previous findings
| Id | Status | Note |
|---|---|---|
| UI-1 | resolved | Table wrapped in `role="region"` scroll container (`overflow-x: auto`, `tabIndex=0`, named by caption). Playwright as alice at 375px: `scrollWidth` 375 = `innerWidth` 375; the region scrolls internally; focus ring 3px solid rgb(31, 79, 191). 768 and 1280: no overflow. Screenshots `ui2/alice_lessons-375.png`, `ui2/focus-375.png` in the scratchpad. |
| UI-2 | resolved | `white-space: nowrap` on Date and Price cells; each `<time>` is 18px high (one line) at 375px. |

### Findings
None new.

### Summary
Both round 1 findings are resolved and confirmed in the running app; axe (wcag2a, wcag2aa, wcag21aa, wcag22aa) reports 0 violations on `/lessons` for alice at 375px. Verdict: pass.
