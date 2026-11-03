# Factory conventions

Defaults every project follows unless a project ADR says otherwise, with a reason.
Read by the Planner (to choose the stack), the Spec Writer (to keep interfaces consistent) and the Builder (to create and extend projects).

Exact versions are not fixed here. The stack ADR of each project pins the latest stable (LTS where it exists) version available at project start.

## 1. Stack options

### Backend

| Option | Choose when |
|---|---|
| **Django** (+ Django REST Framework for APIs) | CRUD-heavy business apps, back-office or admin needs (Django admin covers them), relational data at the center, server-rendered pages acceptable, team wants batteries included (auth, ORM, migrations, admin) |
| **FastAPI** (+ SQLAlchemy 2 + Alembic) | API-first products, the frontend is a separate SPA, many external integrations or I/O-bound work (async), small focused services, OpenAPI contract is a key deliverable |

Tie-breaker: if the product needs an internal admin UI, choose Django. Otherwise choose FastAPI.

### Frontend

| Option | Choose when |
|---|---|
| **Astro** | Content-heavy or mostly static sites: marketing, docs, catalogs, landing pages. Interactive parts as islands (React components inside Astro) |
| **React** (Vite + TypeScript) | Interactive applications: dashboards, portals, complex client-side state, frequent UI changes |
| **Angular** | Large enterprise applications with many forms and modules, long-lived codebases maintained by large teams, or when the client mandates it |

Tie-breaker: choose React for applications and Astro for sites. Choose Angular only when one of its criteria clearly applies.

Do not combine Django server-rendered pages with a separate SPA in the same product. Pick one rendering model.

### Shared

| Concern | Default |
|---|---|
| Database | PostgreSQL |
| Cache / queues | Redis, only when a feature needs it |
| Containers | Docker, one image per deployable service |
| Config | Environment variables only; `.env.example` committed, `.env` never committed |
| Secrets | Never in the repo, never in images; injected at runtime |

## 2. Repository structure

One repository per project. Monorepo layout when backend and frontend coexist:

```
<project>/
├── backend/
├── frontend/
├── docs/
│   └── adr/            # copied from the project plan
├── .ci/ or CI config   # per the CI platform in use
├── docker-compose.yml  # local development: app + PostgreSQL (+ Redis)
├── CLAUDE.md           # project-specific notes for agents
└── README.md           # how to run, test and deploy locally
```

### Backend: Django

```
backend/
├── pyproject.toml
├── manage.py
├── config/             # settings (split base/local/prod), urls, wsgi/asgi
├── apps/
│   └── <domain>/       # one app per business domain: models, views, serializers, admin, tests
└── tests/              # cross-app and integration tests
```

### Backend: FastAPI

```
backend/
├── pyproject.toml
├── alembic/
├── app/
│   ├── main.py
│   ├── core/           # config, security, db session, logging
│   └── <domain>/       # router, schemas, models, service, repository
└── tests/
```

### Frontend

Organize by feature, not by file type:

```
frontend/src/
├── features/<feature>/ # components, hooks/services, tests for that feature
├── shared/             # reusable UI components, utilities, API client
└── ...                 # framework-required folders (pages/ for Astro, app/ for Angular)
```

## 3. Tooling

### Python

| Concern | Tool |
|---|---|
| Package and env management | uv |
| Lint and format | ruff (lint + format) |
| Type checking | mypy, strict on new code |
| Tests | pytest (+ pytest-django or httpx for FastAPI) |
| Coverage | pytest-cov |

### TypeScript

| Concern | Tool |
|---|---|
| Language | TypeScript, `strict: true` |
| Lint | ESLint |
| Format | Prettier |
| Unit and component tests | Vitest (React, Astro); the Angular CLI default runner for Angular |
| End-to-end tests | Playwright |

## 4. API conventions

- REST, JSON, resource names in plural kebab-case: `/api/invoice-items`.
- OpenAPI schema is generated from code and committed or published on every build.
- Versioning by path prefix only when a breaking change is unavoidable: `/api/v2/...`.
- Pagination: `?page=&page_size=`, response `{ "items": [...], "total": n, "page": n, "page_size": n }`.
- Errors: HTTP status code plus body `{ "error": { "code": "machine_readable", "message": "Human readable", "details": {} } }`.
- Dates in ISO 8601, UTC in storage and APIs; convert to the user's time zone in the frontend.
- Money as integer minor units plus ISO 4217 currency code, never floats.

## 5. Security baseline

- Authentication and authorization checked on the server for every endpoint; the frontend only hides UI.
- Input validated at the boundary (DRF serializers, Pydantic models).
- Parameterized queries only, through the ORM; no string-built SQL.
- Dependencies scanned in CI; no known critical vulnerabilities at merge.
- Security headers and CORS restricted to known origins.
- Personal data identified in the spec's Security considerations and never logged.

## 6. Observability

- Structured logs (JSON) to stdout, with a request id propagated across services.
- Health endpoint: `GET /health` returns 200 when the service and its database are reachable.
- Errors reported with stack traces; no secrets or personal data in logs.

## 7. CI pipeline

Every project's CI runs these stages on every pull request. A stage failing blocks the merge.

1. **Install**: locked dependencies only (`uv.lock`, `package-lock.json` or equivalent).
2. **Lint and format check**: ruff, ESLint, Prettier.
3. **Type check**: mypy, `tsc --noEmit`.
4. **Unit and integration tests** with coverage. New code must not lower coverage.
5. **Build**: Docker images build successfully.
6. **Security scan**: SAST and dependency vulnerability scan.
7. **End-to-end tests** (Playwright) when the project has a frontend.

## 8. Definition of done (per feature)

- All acceptance criteria in the spec are covered by automated tests that reference them by id (e.g. test name or docstring contains `AC-3`).
- CI green.
- Migrations included and reversible.
- `README.md` updated if setup, configuration or commands changed.
- No TODOs without a linked backlog item.
