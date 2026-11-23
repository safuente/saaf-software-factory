# ADR-001: Application stack

- Status: proposed
- Date: 2026-11-16

## Context
The brief (`brief.md`, Constraints) mandates a FastAPI backend and a React frontend so the factory's UX and UI reviewers and Playwright tests are exercised. `policies/conventions.md` §1 lists both as approved options. The product is a small interactive app for one role (Teacher) with relational data (teachers, students, lessons) and no internal admin UI requirement (`questions.md` A3).

## Decision
- **Backend**: FastAPI with SQLAlchemy 2 (synchronous sessions) and Alembic migrations, Python managed with uv. Layout per conventions §2 "Backend: FastAPI", one domain package per business area (accounts, students, lessons).
- **Frontend**: React single-page app, Vite + TypeScript (`strict`), organized by feature per conventions §2. React Router for routing, TanStack Query for server state, no global client-state library. Styling with plain CSS (CSS modules), semantic HTML, no third-party component library.
- **API contract**: REST/JSON per conventions §4. The backend's OpenAPI schema is generated from code and committed; frontend API types are generated from that committed schema, so a contract change shows up as a type error.
- **Database**: PostgreSQL, latest stable major.
- **Versions**: F00 pins the latest stable Python, the current Node.js LTS and the latest stable PostgreSQL available when it is built, and records the exact versions in the repository `README.md`.
- **Observability**: conventions §6 as written: JSON logs to stdout with a request id, `GET /health` checking the database, no personal data (student names, emails) in logs.

Selection criteria from conventions §1 that drove the choice:
- Backend, FastAPI: "the frontend is a separate SPA" and "OpenAPI contract is a key deliverable"; tie-breaker "no internal admin UI needed" also points to FastAPI.
- Frontend, React: "interactive applications: dashboards, portals"; the tie-breaker "React for applications". Astro does not fit (not content-heavy); Angular criteria (large enterprise, large teams) do not apply.

## Alternatives considered
- Django + server-rendered pages: fits CRUD, but contradicts the brief's mandated stack and would not exercise the SPA reviewers.
- Async SQLAlchemy: not needed for the load (one teacher, at most 30 students); synchronous sessions keep code and tests simpler.
- A component library: adds a dependency and its own accessibility assumptions for a handful of screens; semantic HTML plus CSS is enough and keeps the UI reviewers' findings about our code.

## Consequences
- Every feature that changes the API must regenerate and commit the OpenAPI schema and the frontend types in the same PR.
- Features add domain packages on the backend and feature folders on the frontend; shared UI pieces (layout, form fields, money and date formatting) live in the frontend's shared area and are reused, not duplicated.
- No Redis: no feature in v1 needs a cache or queue.
