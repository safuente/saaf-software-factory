"""Lesson field bounds of the F02 spec (Behavior: Lesson fields; ADR-003). Migration 0003
enforces the same bounds in the database."""

import re
from datetime import date

DATE_MIN = date(2000, 1, 1)
DATE_MAX = date(2099, 12, 31)
DURATION_MIN = 1
DURATION_MAX = 600
PRICE_MIN_CENTS = 0
PRICE_MAX_CENTS = 1_000_000

ISO_DATE = re.compile(r"\d{4}-\d{2}-\d{2}")

# A calendar month `YYYY-MM` from 2000-01 to 2099-12, the range of lesson dates (F03).
MONTH_PATTERN = r"^20\d{2}-(0[1-9]|1[0-2])$"


def month_range(month: str) -> tuple[date, date]:
    """First day of `month` and first day of the next month, for a validated `YYYY-MM`."""
    year, number = (int(part) for part in month.split("-"))
    start = date(year, number, 1)
    end = date(year + number // 12, number % 12 + 1, 1)
    return start, end
