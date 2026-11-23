"""Schema migrations apply and revert cleanly (spec Behavior: Database schema)."""

from pathlib import Path

from alembic import command
from alembic.config import Config
from alembic.script import ScriptDirectory
from sqlalchemy import create_engine, inspect, text

from app.core.config import Settings

BACKEND_DIR = Path(__file__).resolve().parents[1]


def _alembic_config(settings: Settings) -> Config:
    config = Config(str(BACKEND_DIR / "alembic.ini"))
    config.set_main_option("script_location", str(BACKEND_DIR / "alembic"))
    config.set_main_option(
        "sqlalchemy.url", settings.database_url.render_as_string(hide_password=False)
    )
    return config


def _current_revision(settings: Settings) -> str | None:
    engine = create_engine(settings.database_url)
    try:
        with engine.connect() as conn:
            if not inspect(conn).has_table("alembic_version"):
                return None
            return conn.execute(text("SELECT version_num FROM alembic_version")).scalar()
    finally:
        engine.dispose()


def test_initial_migration_applies_reverts_and_reapplies(settings: Settings) -> None:
    config = _alembic_config(settings)
    head = ScriptDirectory.from_config(config).get_current_head()
    assert head is not None

    command.upgrade(config, "head")
    assert _current_revision(settings) == head

    command.downgrade(config, "base")
    assert _current_revision(settings) is None

    command.upgrade(config, "head")
    assert _current_revision(settings) == head


def test_ac1_migrations_create_teacher_and_session_tables(settings: Settings) -> None:
    """F01 changes F00's "no application tables": the spec's Data model adds teacher and session."""
    command.upgrade(_alembic_config(settings), "head")

    engine = create_engine(settings.database_url)
    try:
        with engine.connect() as conn:
            inspector = inspect(conn)
            tables = set(inspector.get_table_names())
            teacher_columns = {c["name"] for c in inspector.get_columns("teacher")}
            session_columns = {c["name"] for c in inspector.get_columns("session")}
            [session_fk] = inspector.get_foreign_keys("session")
            teacher_unique = inspector.get_unique_constraints("teacher")
            session_unique = inspector.get_unique_constraints("session")
    finally:
        engine.dispose()
    assert {"alembic_version", "teacher", "session"} <= tables  # F02 adds student, lesson
    assert teacher_columns == {"id", "email", "password_hash", "created_at"}
    assert session_columns == {"id", "teacher_id", "token_hash", "created_at", "expires_at"}
    assert session_fk["referred_table"] == "teacher"
    assert session_fk["options"].get("ondelete") == "RESTRICT"
    assert [c["column_names"] for c in teacher_unique] == [["email"]]
    assert [c["column_names"] for c in session_unique] == [["token_hash"]]
