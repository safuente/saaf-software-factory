from typing import Literal

from fastapi import APIRouter, Request
from pydantic import BaseModel

from app.core.db import database_is_reachable
from app.core.errors import AppError, ErrorResponse


class HealthStatus(BaseModel):
    status: Literal["ok"]


def health(request: Request) -> HealthStatus:
    """Healthy only if the database answers. Public; reveals nothing beyond up or down."""
    if not database_is_reachable(request.app.state.engine):
        raise AppError(503, "database_unavailable", "Database is not reachable")
    return HealthStatus(status="ok")


router = APIRouter(tags=["health"])
for path, operation_id in (("/health", "getHealth"), ("/api/health", "getApiHealth")):
    router.add_api_route(
        path,
        health,
        methods=["GET"],
        operation_id=operation_id,
        responses={503: {"model": ErrorResponse, "description": "Database is not reachable"}},
    )
