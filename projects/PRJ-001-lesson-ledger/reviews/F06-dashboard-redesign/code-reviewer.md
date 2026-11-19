---
feature: F06
project: PRJ-001
reviewer: code
round: 3
verdict: pass
blocking: 0
suggestions: 2
reviewed: feature/F06-dashboard-redesign @ 84158b59cb96bc26723c7099bf36208c7b745f7a
---

# Code review: F06 Dashboard redesign of every page and the app shell

## Round 3

### Previous findings
- CODE-1 (suggestion, students list has no grey label): resolved. `Section` takes `label` and `StudentsPage` sets it, so "Your students" renders in `text-slate`. Text, level and id are unchanged, no new copy.
- CODE-2 (suggestion, stale comment in `Table.tsx`): resolved. The comment is re-wrapped (a7352b1).

### Checks
`checks` commit equals head (84158b5), result pass: backend 323 passed / frontend 370 passed, coverage 99%, e2e 160 passed.

### TDD
- APR-1: `test(F06)` 72ed326 comes before `fix(F06)` fccd708.
- APR-2: `test(F06)` 6701c05 comes before `fix(F06)` 57be7bc.
- The build report records the expected failure reason for each new test (Log out 539.6 px above the header bottom, label `rgb(29, 33, 39)`, no `text-slate`).

### Changed existing tests (AC-5 b)
Both changes are justified in the build report and strengthen the checks:
- `e2e/f06-shell.spec.ts` "AC-2a,c,e at 1280": Log out is now compared with the header's bottom, not the viewport's bottom. This is stricter, since it also asserts that Log out is inside the sidebar.
- `ShellLogOut.test.tsx` "AC-2a,e": the class assertion follows the new structure (`lg:min-h-screen` on the row, `lg:flex-col` on the header, `lg:flex-1` on the inner column). Nothing is loosened.

### Review of the changes
- `Page.tsx`: the header becomes `lg:flex lg:flex-col` and the inner column `lg:flex-1`. The header stretches to the row height, so `mt-auto` on Log out reaches the sidebar's real bottom. Neither is fixed nor sticky. Below `lg` the layout is unchanged.
- `Section.tsx`: an optional boolean `label` with a default of false. This is the smallest change, and no other caller is affected.
- `docs/design.md` matches the behaviour.
- The change adds no dependencies, migrations, requests or scope.

### Findings
No new findings. Open suggestions: none from earlier rounds; the two below are listed only for the count.

#### CODE-1: Students list has no grey header or label (AC-3 d)
- **Severity**: suggestion
- **Category**: scope
- **Status**: resolved in round 3

#### CODE-2: Stale comment line in Table.tsx
- **Severity**: suggestion
- **Category**: naming
- **Status**: resolved in round 3

### Summary
Both fixes are test-first, small and correct. Checks pass on the current head. No blocking findings.
