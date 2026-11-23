"""Student name rule of the F02 spec (Behavior: Student name)."""

import unicodedata

NAME_MAX_LENGTH = 100


class InvalidNameError(ValueError):
    """`code` is a stable machine-readable reason; the message never quotes the value."""

    def __init__(self, code: str, message: str) -> None:
        super().__init__(message)
        self.code = code
        self.message = message


def normalize_name(raw: str) -> str:
    """Trimmed name; raises InvalidNameError when it is empty, too long or has control characters.
    Length is counted in Unicode code points."""
    name = raw.strip()
    if not name:
        raise InvalidNameError("name_required", "Enter the student's name")
    if len(name) > NAME_MAX_LENGTH:
        raise InvalidNameError("name_too_long", "Name must be 100 characters or fewer")
    if any(unicodedata.category(ch) == "Cc" for ch in name):
        raise InvalidNameError("name_control_characters", "Name can't contain tabs or line breaks")
    return name
