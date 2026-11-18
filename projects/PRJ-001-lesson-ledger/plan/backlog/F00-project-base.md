---
id: F00
project: PRJ-001
type: feature
priority: high
milestone: v1
depends_on: []
touches_frontend: true
adrs: [ADR-001, ADR-002]
---

## Problem
There is no repository for Lesson Ledger. No feature can be built, tested or reviewed until a project base exists with the agreed stack, a working local environment and a passing quality gate.

## Affected user
The factory agents (Builder, reviewers, Approver) and the developers who run the project locally. Teachers are not affected yet.

## Expected result
- The repository exists at the brief's repo path with the backend, frontend and docs layout of the stack ADR and the factory conventions, including the ADRs copied into the docs, a README with run and test instructions, and project notes for agents.
- `make up` starts the database, backend and frontend for the worktree's `COMPOSE_PROJECT_NAME` and returns only when all are healthy; `make down` removes containers and volumes. Two worktrees with different `.env` values run side by side without conflicts.
- Deploy target reached: the local docker compose stack. The backend's health check returns 200 when the database is reachable, and opening `APP_URL` shows an empty application shell titled "Lesson Ledger" that can reach the backend through the same origin.
- `make check` passes with quiet output, running every local CI stage: install from lock files, lint and format check, type check, backend and frontend tests with coverage, Docker image build, security scan (SAST and dependency vulnerabilities).
- `make e2e` passes with one smoke test that opens `APP_URL` and sees the application shell.
- `make install`, `make seed` (idempotent, no data yet) and `make lint` exist and succeed; the committed OpenAPI schema is generated from the backend.

## Out of scope
- Any business feature: accounts, students, lessons, summaries.
- Hosted CI and any remote or production environment (ADR-002).
- Visual design beyond a minimal accessible shell.

## Constraints
- Follow `policies/conventions.md` §2 (repository structure, local environment, Makefile targets, quiet output) and §7 (CI stages), as narrowed by ADR-002.
- No hardcoded host ports or URLs; everything comes from `.env`. `.env.example` committed, `.env` ignored.
- Exact runtime versions pinned and recorded in the README (ADR-001).

## Context
- `brief.md` Constraints: FastAPI + React, local only, at most 4 features.
- `questions.md` Q1 (local-only CI) and A2 (meaning of "deployable").
- ADR-001, ADR-002.
