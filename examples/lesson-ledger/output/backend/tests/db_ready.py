"""Exit 1 with a one-line hint if this worktree's database is not reachable (used by make test)."""

import sys

from app.core.config import Settings
from app.core.db import create_db_engine, database_is_reachable


def main() -> int:
    settings = Settings.from_env()
    engine = create_db_engine(settings)
    try:
        if database_is_reachable(engine):
            return 0
    finally:
        engine.dispose()
    sys.stdout.write(
        f"database not reachable at {settings.db_host}:{settings.db_port}: run `make up` first\n"
    )
    return 1


if __name__ == "__main__":
    sys.exit(main())
