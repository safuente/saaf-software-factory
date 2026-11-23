---
feature: F09
project: PRJ-001
reviewer: ui
round: 1
verdict: pass
blocking: 0
suggestions: 1
reviewed: feature/F09-branded-sign-in-pages @ cec9bc3b5a028f5af3a2dbdc4689f45cfef39f4b
---

# UI review: F09 Branded sign-in pages

## Round 1

### Findings

#### UI-1: Illustration sits small and low-left in the wide panel
- **Severity**: suggestion
- **Category**: design-direction
- **Location**: `/login`, `/signup` at 1280 and 1920 px / brand panel
- **Criterion**: none
- **Problem**: The illustration is capped at `max-w-illustration` (24rem) and pinned to the bottom of a panel that is about 930 px wide at 1920 px. A large empty band separates it from the value line, and it looks undersized next to the 2.5rem wordmark.
- **Evidence**: screenshot `/private/tmp/claude-501/-Users-saaf-workspace-saaf-software-factory/1970f24f-a397-48d4-a233-ca6562813eac/scratchpad/ui/login-1920.png`.
- **Suggestion**: Optional. Raise the illustration's theme width at `xl`, or centre it vertically in the free space.

### Summary
Pass. At 320, 375, 667x375, 768, 1024, 1280 and 1920 px there is no horizontal scroll, and 200% root text at 1280 px wraps cleanly. axe (wcag2a/aa/21aa/22aa) reports 0 violations on `/login` and `/signup` at 375 and 1280 px, and on the logged-out notice and field-error states. Tab order is Email, Password, submit, link. Exactly one animation (`brand-enter`) runs with motion allowed. Styling uses theme classes only, with no arbitrary values or `style` attributes. Not checked: dark mode (the product has none), and the per-state e2e checks and CSP, which the other reviewers cover.
