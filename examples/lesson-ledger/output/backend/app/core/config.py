import os
from collections.abc import Mapping
from dataclasses import dataclass

from sqlalchemy import URL


@dataclass(frozen=True)
class Settings:
    """Runtime configuration, read only from environment variables.

    Inside Docker, compose sets DATABASE_HOST/DATABASE_PORT to the `db` service. On the host
    (tests, tooling) they are unset and the worktree's published DB_PORT on localhost is used.
    """

    db_host: str
    db_port: int
    db_user: str
    db_password: str
    db_name: str
    db_timeout_seconds: int = 2
    # Must be true whenever the app is served over HTTPS (ADR-004); false for local HTTP.
    session_cookie_secure: bool = False

    @classmethod
    def from_env(cls, env: Mapping[str, str] = os.environ) -> Settings:
        return cls(
            db_host=env.get("DATABASE_HOST", "localhost"),
            db_port=int(env.get("DATABASE_PORT") or env.get("DB_PORT") or 5432),
            db_user=env.get("POSTGRES_USER", ""),
            db_password=env.get("POSTGRES_PASSWORD", ""),
            db_name=env.get("POSTGRES_DB", ""),
            session_cookie_secure=env.get("SESSION_COOKIE_SECURE", "false").lower() == "true",
        )

    @property
    def database_url(self) -> URL:
        return URL.create(
            "postgresql+psycopg",
            username=self.db_user,
            password=self.db_password,
            host=self.db_host,
            port=self.db_port,
            database=self.db_name,
        )
