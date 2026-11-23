"""Render the OpenAPI schema from the code: `python -m app.openapi > openapi.json`."""

import json
import sys

from app.main import create_app


def render_schema() -> str:
    return json.dumps(create_app().openapi(), indent=2, sort_keys=True) + "\n"


if __name__ == "__main__":
    sys.stdout.write(render_schema())
