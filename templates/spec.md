---
id: F00                     # same id as the feature entry
project: PRJ-000
entry: projects/PRJ-000-name/plan/backlog/F00-slug.md
status: draft               # draft | needs-clarification | approved | superseded
version: 1
touches_frontend: false     # copied from the entry
adrs: []                    # copied from the entry, plus any found relevant
---

<!--
Feature spec, written by the Spec Writer from a feature entry.
A human sets status to "approved" before the Builder starts.
The Approver verifies the Builder's work against the Acceptance criteria.
Remove these comments in real specs. Write "None" for sections that do not apply.
-->

# <Feature title>

## Summary
<!-- 2-4 sentences: what changes for the user once this ships. -->

## Acceptance criteria
<!--
Numbered, each one independently verifiable by running the software.
Given / When / Then. Cover the happy path, empty states, errors and permissions.
Every "Expected result" bullet in the entry must map to at least one criterion.
-->
- **AC-1**: Given <precondition>, when <action>, then <observable result>.
- **AC-2**:

## Behavior
<!-- Rules the Builder needs that do not fit in a single criterion: validations, limits, ordering, defaults, edge cases. -->
-

## Interfaces
<!--
Changes at the system's boundaries only: API endpoints (method, path, request, response, errors),
events, data model (entities and fields), configuration. Not internal code structure.
-->

### API
<!-- e.g. GET /api/invoices?from=&to= → 200 [{id, date, amount, pdfUrl}] | 403 if not account admin -->

### Data model
<!-- New or changed entities and fields. Migrations needed. -->

## UI
<!-- Only if touches_frontend. Screens affected and their states: loading, empty, error, success, no permission. Link designs. -->

## Security considerations
<!-- Who may do what, data exposed, input that must be validated, audit needs. Guides the Security reviewer. -->
-

## Non-functional
<!-- Performance, limits, accessibility, i18n requirements that apply to this feature. -->
-

## Out of scope
<!-- Copied from the entry and extended with anything the spec deliberately excludes. -->
-

## Traceability
<!-- Each "Expected result" bullet from the entry → the criteria that cover it. -->
| Expected result | Criteria |
|---|---|
| | AC-1 |

## Open questions
<!-- Only when status is needs-clarification. Numbered, each answerable in 1-2 sentences. Answer inline. -->

## Changelog
<!-- One line per version after v1. -->
