---
feature: F00
project: PRJ-001
reviewer: ux
round: 1
verdict: pass
blocking: 0
suggestions: 0
reviewed: feature/F00-project-base @ ddfc3e54f884d1368ebca273214de44ab6f5479c
---

# UX review: F00 Project base

## Round 1

### Findings

None.

### Summary
The shell matches every state in the spec's UI section, so no blocking findings. Checked at http://localhost:3101 with Playwright. Screenshots are in /private/tmp/claude-501/-Users-saaf-workspace-saaf-software-factory/1970f24f-a397-48d4-a233-ca6562813eac/scratchpad/.

- **Success** (`shell.png`): title "Lesson Ledger", one `h1` inside one `main`.
- **Client path** (`clientpath.png`): `/any/client/path` returns 200 with the same shell.
- **Error, backend down** (`apidown.png`): the shell renders unchanged with `/api/**` aborted.
- **JavaScript disabled** (`nojs.png`): shows "Lesson Ledger needs JavaScript enabled."
- **Loading, empty and no permission**: not applicable per the spec.
- **Seed data**: F00 loads none, so nothing is missing.
- **Out of scope, not reviewed**: visual design and accessibility belong to the UI reviewer.
