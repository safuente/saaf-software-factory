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

### Styling

Every project with a frontend uses a CSS framework, chosen in the stack ADR and set up in `F00`. No project styles its interface with hand-written CSS only.

| Option | Choose when |
|---|---|
| **Tailwind CSS** (default) | Most projects: custom look per product, React or Astro, design tokens kept in the Tailwind theme |
| **Bootstrap** | Admin panels, back-office tools and internal apps where ready-made components (navbar, forms, tables, modals) matter more than a distinctive look, or when the client mandates it. With React, use plain Bootstrap CSS classes, without jQuery or Bootstrap's JavaScript bundle |

Tie-breaker: choose Tailwind CSS.

**Visual identity.** `F00` defines it with the `frontend-design` skill and writes the design plan to `docs/design.md` in the project repository: palette, typefaces and type scale, layout concept and principles. The framework theme implements that plan. Later features follow it and change it only when their spec asks for it.

Rules for both:

- **The theme is the design system.** Brand colors, typography, spacing, radii and breakpoints are defined once: in the Tailwind theme (`@theme` in the main CSS file, or `tailwind.config`), or in Bootstrap's Sass variables. Components use the theme's names (`bg-primary`, `text-muted`, `btn-primary`), never literal hex values, pixel sizes or arbitrary values like `p-[13px]`.
- **Shared components wrap the framework.** Buttons, inputs, tables, alerts and the page layout live in `frontend/src/shared/` and are reused by every feature. Features do not repeat long class lists for the same element.
- **Custom CSS is the exception.** Only for what the framework cannot express. Keep it in the shared styles folder and use the theme's variables.
- **Accessible defaults.** The theme's colors meet WCAG AA contrast for text and UI components. Focus styles stay visible. Never remove them with `outline-none` or `focus:outline-0` without a replacement.
- **Versions.** Latest stable major of the chosen framework, pinned in the lock file, installed as a dependency and built with the frontend. No CDN links.

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
├── Makefile            # standard targets, see "Local environment"
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

### Local environment

The factory runs several features of several projects at the same time on one machine, each in its own git worktree with its own running environment. Every project must support that:

- **Host ports come from environment variables** in `docker-compose.yml`, with defaults: `${APP_PORT:-8000}` (backend), `${FRONTEND_PORT:-3000}`, `${DB_PORT:-5432}`, `${REDIS_PORT:-6379}`. No hardcoded host ports.
- **No `container_name`** in `docker-compose.yml`. It breaks isolation by `COMPOSE_PROJECT_NAME`.
- **`.env` drives everything.** Docker compose reads it automatically, including `COMPOSE_PROJECT_NAME`, and the `Makefile` starts with `-include .env` and `export`. The factory writes these variables into `.env` for each worktree: `COMPOSE_PROJECT_NAME`, `APP_PORT`, `FRONTEND_PORT`, `DB_PORT`, `REDIS_PORT`, `APP_URL`, `API_URL`. Code and tests must read ports and URLs from them, never assume defaults.
- **Tests connect to the database of the same compose project** through `DB_PORT`, so two worktrees never share a database.

Standard `Makefile` targets. The factory calls these, never stack-specific commands:

| Target | Does | Requirements |
|---|---|---|
| `install` | Install dependencies from lock files | Idempotent |
| `up` | Start the app and its dependencies in the background | Returns only when every service is healthy (`docker compose up -d --wait`) |
| `down` | Stop and remove containers **and volumes** | Leaves nothing running for this `COMPOSE_PROJECT_NAME` |
| `seed` | Load local review data | Idempotent. One test user per role, with credentials listed in `README.md`. Data to reach every state described in the specs' UI sections: empty, many items, errors, no permission. Local only, never in production migrations |
| `lint` | Lint, format check and type check | Needs no database or running app |
| `test` | Full test suite with coverage. `make test T=<path or test id>` runs only those tests, without coverage | Needs `up` |
| `e2e` | Playwright tests against `APP_URL`. `make e2e T=<spec file>` runs only that file | Needs `up`; only for projects with a frontend |
| `check` | Every local CI stage: `lint`, `test`, build | Exits non-zero if any stage fails |

**Quiet output.** Agents read everything a target prints, and every line printed stays in their context. So every target prints:

- On success, one summary line per stage, e.g. `lint ok`, `412 passed in 38s, coverage 87%`.
- On failure, only what is needed to fix it: the failing tests with their assertion and traceback, or the lint errors.
- Never progress bars, dependency download logs or the passing tests one by one. Use the tools' quiet flags, e.g. `pytest -q --no-header -p no:cacheprovider`, `ruff --quiet`, `vitest --reporter=dot`, `playwright test --reporter=line`, `docker compose --progress quiet`.

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

Locally, `make check` runs stages 1 to 6 and `make e2e` runs stage 7.

## 8. Definition of done (per feature)

- All acceptance criteria in the spec are covered by automated tests that reference them by id (e.g. test name or docstring contains `AC-3`).
- CI green.
- Branch rebased on the base branch; migrations apply cleanly after the base's migrations.
- Migrations included and reversible.
- If the feature touches the frontend: `make seed` reaches every state in the spec's UI section.
- `README.md` updated if setup, configuration or commands changed.
- No TODOs without a linked backlog item.
