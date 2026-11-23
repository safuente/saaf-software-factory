import pytest
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError

from app.core.config import Settings
from app.core.db import create_db_engine


def test_database_errors_do_not_include_bound_parameters(settings: Settings) -> None:
    """SEC-3: a failing query must not carry its parameters (personal data) into logs."""
    engine = create_db_engine(settings)
    query = text("SELECT :value FROM table_that_does_not_exist")
    personal_data = "student-name-that-must-not-be-logged"
    try:
        with pytest.raises(SQLAlchemyError) as excinfo, engine.connect() as conn:
            conn.execute(query, {"value": personal_data})
    finally:
        engine.dispose()

    assert personal_data not in str(excinfo.value)
