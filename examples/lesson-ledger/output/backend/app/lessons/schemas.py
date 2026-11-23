import datetime as dt
from typing import Annotated, Literal

from pydantic import BaseModel, ConfigDict, Field, StrictBool, StrictInt, field_validator
from pydantic_core import PydanticCustomError

from app.accounts.schemas import UtcDateTime
from app.core.pagination import Page
from app.lessons.rules import (
    DATE_MAX,
    DATE_MIN,
    DURATION_MAX,
    DURATION_MIN,
    ISO_DATE,
    PRICE_MAX_CENTS,
    PRICE_MIN_CENTS,
)
from app.students.schemas import StudentRef

Currency = Literal["USD"]
Cents = Annotated[StrictInt, Field(ge=PRICE_MIN_CENTS, le=PRICE_MAX_CENTS)]


class Money(BaseModel):
    """Integer minor units plus ISO 4217 code (conventions §4, ADR-003)."""

    amount: int
    currency: Currency


class MoneyIn(Money):
    amount: Cents


class RecordLessonRequest(BaseModel):
    """Unknown fields, including `paid`, are ignored: a lesson always starts unpaid."""

    student_id: StrictInt
    date: dt.date
    duration_minutes: Annotated[StrictInt, Field(ge=DURATION_MIN, le=DURATION_MAX)]
    price: MoneyIn

    @field_validator("date", mode="before")
    @classmethod
    def _iso_date_string(cls, value: object) -> object:
        if not isinstance(value, str) or not ISO_DATE.fullmatch(value):
            raise PydanticCustomError("date_format", "Date must be YYYY-MM-DD")
        return value

    @field_validator("date")
    @classmethod
    def _date_in_range(cls, value: dt.date) -> dt.date:
        if not DATE_MIN <= value <= DATE_MAX:
            raise PydanticCustomError("date_range", "Date must be from 2000-01-01 to 2099-12-31")
        return value


class SetPaidRequest(BaseModel):
    """The only change to a lesson (Q3): any other field is rejected, so no other lesson data
    can be modified."""

    model_config = ConfigDict(extra="forbid")

    paid: StrictBool


class LessonOut(BaseModel):
    id: int
    student: StudentRef
    date: dt.date
    duration_minutes: int
    price: Money
    paid: bool
    created_at: UtcDateTime


class MonthlySummary(BaseModel):
    """Totals of the teacher's lessons dated in `month` (ADR-003, F03 Behavior: Totals)."""

    month: str
    lesson_count: int
    collected: Money
    pending: Money


class PendingLessons(Page[LessonOut]):
    """One page of unpaid lessons; `amount_pending` sums every unpaid lesson of the teacher."""

    amount_pending: Money
