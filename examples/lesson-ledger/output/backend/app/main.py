from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI

from app.accounts.auth import authenticate_unless_public
from app.accounts.router import router as accounts_router
from app.core.config import Settings
from app.core.db import create_db_engine
from app.core.errors import register_error_handlers
from app.core.http import require_json_body
from app.core.request_context import RequestContextMiddleware
from app.health.router import router as health_router
from app.lessons.router import pending_router, summaries_router
from app.lessons.router import router as lessons_router
from app.students.router import router as students_router


def create_app(settings: Settings | None = None) -> FastAPI:
    settings = settings or Settings.from_env()
    engine = create_db_engine(settings)

    @asynccontextmanager
    async def lifespan(_: FastAPI) -> AsyncIterator[None]:
        yield
        engine.dispose()

    app = FastAPI(
        title="Lesson Ledger API",
        version="0.1.0",
        docs_url=None,
        redoc_url=None,
        openapi_url=None,
        lifespan=lifespan,
        dependencies=[Depends(authenticate_unless_public), Depends(require_json_body)],
    )
    app.state.settings = settings
    app.state.engine = engine
    register_error_handlers(app)
    app.add_middleware(RequestContextMiddleware)
    app.include_router(health_router)
    app.include_router(accounts_router)
    app.include_router(students_router)
    app.include_router(lessons_router)
    app.include_router(summaries_router)
    app.include_router(pending_router)
    return app


app = create_app()
