---
feature: F01
project: PRJ-001
reviewer: ui
round: 1
verdict: pass
blocking: 0
suggestions: 0
reviewed: feature/F01-teacher-accounts @ 23a6634c8c6a05d14fd2b5950f7bd9890b8c3800
---

# UI review: F01 Teacher accounts

## Round 1

### Previous findings
None (round 1).

### Findings
None.

### Summary
No blocking findings. Screens `/login`, `/signup` and `/` (default, empty-field, invalid, duplicate-email and wrong-password states) were captured at 375, 768 and 1280 px with no horizontal scroll (scrollWidth equals viewport at every width). axe-core (wcag2a, wcag2aa, wcag21aa, wcag22aa) reports 0 violations on every state at 1280 px. Colors, spacing, type sizes, radius and focus ring come from `frontend/src/shared/styles/tokens.css`, the new shared components are `Page` and `TextField`, labels, hints and errors are tied with `aria-describedby`, `aria-invalid` is set on invalid fields, and the focus ring is visible. No dark mode and no animations exist, so those checks do not apply. Screenshots: the scratchpad `ui/` directory (`<state>-<width>.png`).
