from collections.abc import Iterator

from fastapi import Request
from sqlalchemy import Engine, create_engine, text
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import DeclarativeBase, Session

from app.core.config import Settings


def create_db_engine(settings: Settings) -> Engine:
    """Engine that fails fast when PostgreSQL is gone and reconnects once it is back."""
    timeout = settings.db_timeout_seconds
    return create_engine(
        settings.database_url,
        pool_pre_ping=True,
        hide_parameters=True,
        pool_timeout=timeout,
        connect_args={
            "connect_timeout": timeout,
            "options": f"-c statement_timeout={timeout * 1000}",
        },
    )


def database_is_reachable(engine: Engine) -> bool:
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
    except SQLAlchemyError:
        return False
    return True


class Base(DeclarativeBase):
    """Declarative base of every ORM model; tables are created by Alembic migrations only."""


def get_db(request: Request) -> Iterator[Session]:
    """One ORM session per request, closed when the response is done."""
    with Session(request.app.state.engine) as session:
        yield session
