---
feature: F03
project: PRJ-001
reviewer: ui
round: 1
verdict: pass
blocking: 0
suggestions: 1
reviewed: feature/F03-monthly-summary-and-payments @ 519d18c50f1ff052a74ebd3f98e34e6e0f466ec1
---

# UI review: F03 Monthly summary, pending payments, mark as paid

## Round 1

### Findings

#### UI-1: Month navigation buttons wrap onto two lines at 375px
- **Severity**: suggestion
- **Category**: consistency
- **Location**: `/summary` at 375px, `.monthNav` in `frontend/src/shared/ui/ui.module.css`
- **Criterion**: none
- **Problem**: "Previous month", the heading and "Next month" do not fit on one row at 375px, so "Next month" drops below and the previous/heading/next order reads awkwardly.
- **Evidence**: screenshot scratchpad/ui/alice-375-_summary.png (/private/tmp/claude-501/-Users-saaf-workspace-saaf-software-factory/1970f24f-a397-48d4-a233-ca6562813eac/scratchpad/ui/). Nothing is cut off and there is no overflow.
- **Suggestion**: On narrow screens put the heading on its own row with the two buttons side by side beneath it, or use a smaller button padding.

### Summary
No blocking findings. Screens `/summary` (current month, 2020-01) and `/pending` for alice, bob and carol at 375, 768 and 1280px: no horizontal page scroll, axe (wcag2a, 2aa, 21aa, 22aa) reports 0 violations, and new CSS uses only tokens, with existing Page, Alert, StatusMessage and LoadError components reused. The table scrolls inside a labelled, focusable region on mobile. Not verified: dark mode (the product has none), the load-error and in-flight states (no backend stop allowed), keyboard focus after mark/undo (covered by e2e, not rerun). Pre-existing note: nav links are 18px tall (under 24px), the spacing exception likely applies, and F03 only adds two items to it.
