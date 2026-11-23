from pydantic import BaseModel, field_validator
from pydantic_core import PydanticCustomError

from app.accounts.schemas import UtcDateTime
from app.students.rules import InvalidNameError, normalize_name


class AddStudentRequest(BaseModel):
    name: str

    @field_validator("name")
    @classmethod
    def _valid_name(cls, value: str) -> str:
        try:
            return normalize_name(value)
        except InvalidNameError as error:
            raise PydanticCustomError(error.code, error.message) from None


class StudentOut(BaseModel):
    id: int
    name: str
    created_at: UtcDateTime


class StudentRef(BaseModel):
    id: int
    name: str
