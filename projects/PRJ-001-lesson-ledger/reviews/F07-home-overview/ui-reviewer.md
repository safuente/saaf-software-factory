---
feature: F07
project: PRJ-001
reviewer: ui
round: 1
verdict: pass
blocking: 0
suggestions: 1
reviewed: feature/F07-home-overview @ f64fbf217de4b367c9ccdf941ddbec43bf4d6e3b
---

# UI review: F07 Home overview

## Round 1

### Findings

#### UI-1: "Mark as paid" is off-screen at 375 px in the Home tables
- **Severity**: suggestion
- **Category**: responsive
- **Location**: `/` at 375 px, "Oldest unpaid lessons" and "Latest lessons" tables
- **Criterion**: AC-6 (c)
- **Problem**: At 375 px the tables scroll horizontally inside their container (F05 AC-3 d/e pattern, same `Table` as `/pending`). Price and Action columns are cut off, so the primary row action needs a sideways scroll. No page-level overflow, so it is not blocking.
- **Evidence**: scratchpad `ui/alice-375.png` (Price shows "$3", Action not visible); `scrollWidth` equals viewport at 375, 768, 1280 for alice, bob, carol.
- **Suggestion**: Optional. Narrow the Student column or reflow rows to cards on phones for the Home table.

### Summary
Pass. Home uses the shared components and theme names, with no hardcoded values in the diff. Layout holds at 375, 768 and 1280 for alice, bob and carol with no page overflow. Axe (WCAG 2.0 to 2.2 AA tags) reported 0 violations at 375 and 1280 for all three seeds. The look matches ADR-006 and the reference: black primary action beside an outlined secondary, a bordered figures panel, and a dark sidebar. Not covered: dark mode (none in the product), keyboard and error states were left to the e2e checks and not re-run.
