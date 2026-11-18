---
feature: F00
project: PRJ-001
reviewer: ui
round: 1
verdict: pass
blocking: 0
suggestions: 1
reviewed: feature/F00-project-base @ ddfc3e5
---

# UI review: F00 Project base

## Round 1

### Previous findings
None (round 1).

### Findings

#### UI-1: Colors hardcoded in global.css with no tokens
- **Severity**: suggestion
- **Category**: tokens
- **Location**: `frontend/src/shared/styles/global.css:11-12`
- **Criterion**: none
- **Problem**: Text and background colors are literals (`#1a1a1a`, `#ffffff`) and spacing in `App.module.css` is literal rem values. No design tokens exist yet, so later features will copy literals.
- **Evidence**: `color: #1a1a1a; background-color: #ffffff;`. Not blocking: there is no design system or theme to use in F00 and the spec excludes visual design beyond a minimal shell.
- **Suggestion**: Define CSS custom properties (color, spacing, font) in `global.css` `:root` and reference them, so F01 onward has tokens to extend.

### Summary
The shell passes: at 375, 768 and 1280px there is no horizontal scroll (scrollWidth equals clientWidth) and `/` and `/any/client/path` render identically. It has `lang="en"`, title "Lesson Ledger", one `h1` inside one `main`, and text contrast is 17.4:1. An axe-core scan (wcag2a, 2aa, 21aa, 22aa, best-practice) reports 0 violations; `@axe-core/cli` could not run here because it needs a ChromeDriver, so I injected axe-core via Playwright with CSP bypass. There are no interactive elements, so keyboard, focus and target-size checks do not apply. No dark mode is supported and none is required. Screenshots are in the scratchpad (`s375.png`, `s768.png`, `s1280.png`, `dark.png`).
