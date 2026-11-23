from collections.abc import Iterator
from pathlib import Path

import pytest
from alembic import command
from alembic.config import Config
from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.core.config import Settings
from app.main import create_app
from tests.accounts_support import Accounts

BACKEND_DIR = Path(__file__).resolve().parents[1]


def alembic_config(settings: Settings) -> Config:
    config = Config(str(BACKEND_DIR / "alembic.ini"))
    config.set_main_option("script_location", str(BACKEND_DIR / "alembic"))
    config.set_main_option(
        "sqlalchemy.url", settings.database_url.render_as_string(hide_password=False)
    )
    return config


@pytest.fixture
def settings() -> Settings:
    """Settings for this worktree's database, read from the environment (.env via make)."""
    return Settings.from_env()


@pytest.fixture(scope="session", autouse=True)
def _schema_at_head() -> None:
    """Tests run against the code's migrations, not whatever the running backend image applied."""
    command.upgrade(alembic_config(Settings.from_env()), "head")


@pytest.fixture
def app(settings: Settings) -> Iterator[FastAPI]:
    application = create_app(settings)
    yield application
    application.state.engine.dispose()


@pytest.fixture
def client(app: FastAPI) -> Iterator[TestClient]:
    with TestClient(app, raise_server_exceptions=False) as test_client:
        yield test_client


@pytest.fixture
def accounts(settings: Settings) -> Iterator[Accounts]:
    """Direct database access for account tests; removes every teacher the test touched."""
    support = Accounts(settings)
    yield support
    support.close()
