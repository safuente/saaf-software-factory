---
feature: F08
project: PRJ-001
reviewer: ui
round: 1
verdict: pass
blocking: 0
suggestions: 2
reviewed: feature/F08-icons-brand-and-motion @ 7bac4f31a5d3771c81e5e7ae3cb5d77d024ea697
---

# UI review: F08 Icons, brand and motion

## Round 1

### Findings

#### UI-1: Brand sits tight against the first nav row in the top bar
- **Severity**: suggestion
- **Category**: consistency
- **Location**: `frontend/src/shared/ui/Brand.tsx:9` / all app pages at 375 px
- **Criterion**: AC-2
- **Problem**: Below 1024 px the brand has no bottom margin (`lg:mb-8` only), so the Home pill starts a few pixels under the logo tile. It reads as one cramped block next to the roomy 1280 px sidebar.
- **Evidence**: screenshots `scratchpad/ui/shots/summary-375.png` and `bobhome-375.png`.
- **Suggestion**: add a small theme spacing gap below the brand in the top bar.

#### UI-2: Illustrations are low-key
- **Severity**: suggestion
- **Category**: design-direction
- **Location**: `/students`, `/summary` empty states (bob)
- **Criterion**: AC-3
- **Problem**: Dashed `outline`-grey linework at 80 px is faint on white. It is decorative, so this is polish only.
- **Evidence**: `bobstudents-1280.png`, `bobsummary-1280.png`.
- **Suggestion**: optional; consider a `graphite` stroke for the key shapes.

### Summary
No blocking issues. At 375, 768 and 1280 px the 13 screens/states I captured have no horizontal scroll (also 320 px on /lessons and 200% text on Home), and axe (WCAG 2.2 AA tags) reported zero violations on all of them. Checked in the browser: icons are consistent Lucide glyphs; the logo and favicon match; `/favicon.svg` returns `image/svg+xml` with the same CSP as `/`. Under `no-preference`, transitions are 0.18 s on colour properties only, fade 0.3 s, grow 0.6 s, each ×1. Under `reduce`, no transition or animation exists. The focus ring is 2 px solid `focus` colour and is not transitioned. Inline text links under 24 px are exempt from 2.5.8 as inline links. Not exercised: the green highlight after mark-as-paid (it changes seed data; I relied on the documented `paid-wash` contrast ratios), and dark mode (the product has none).
