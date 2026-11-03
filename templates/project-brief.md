---
id: PRJ-000                 # unique project id
name: project-name          # kebab-case, used for folder and repo names
repo: ../project-name       # path to the project's code repository; may not exist yet before F00
client: Client Name
owner: name@company.com     # human accountable for answering discovery questions
---

<!--
Project brief. Copy to projects/<id>-<name>/brief.md and fill it in.
Sections marked REQUIRED must be filled. Write "None" if a section
intentionally has no content; do not leave it empty.
Describe problems and needs, not solutions. The Planner designs the solution.
Supporting material (notes, API contracts, designs) goes in context/.
-->

## Vision
<!-- REQUIRED. What this product is and why it exists, in 2-3 sentences. -->

## Users and roles
<!-- REQUIRED. Who uses it and what each role needs to do. -->
- **Role**: description, main goals

## Main features
<!-- REQUIRED. High-level list. One line each, no implementation detail. -->
-

## Out of scope
<!-- REQUIRED. What this project will not do, especially things a reader might assume it does. -->
-

## Non-functional requirements
<!-- REQUIRED. Write "Factory defaults" if there is nothing specific. -->
- **Load**: expected users, concurrent users, requests/day
- **Availability**:
- **Performance**:
- **Data retention**:
- **Languages / locales**:
- **Accessibility**:

## Security and compliance
<!-- REQUIRED. Auth model, personal or sensitive data, applicable regulations. -->
- **Authentication**:
- **Sensitive data**:
- **Regulations**:

## Integrations
<!-- External systems this product talks to. For each, put its contract (OpenAPI, schema) in context/ and reference it here. -->
| System | Purpose | Contract | Owner | Sandbox available |
|---|---|---|---|---|
| | | context/<file> | | yes / no |

## Constraints
<!-- Mandatory stack, hosting, budget, deadlines, existing codebase (path or URL). -->
-

## Milestones
<!-- REQUIRED. What must exist at each milestone. v1 is the minimum releasable product. -->
- **v1**:
- **v2**:
