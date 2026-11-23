"""Email and password rules of the F01 spec (Behavior: Email rules, Password rules)."""

EMAIL_MIN_LENGTH = 3
EMAIL_MAX_LENGTH = 254
PASSWORD_MIN_LENGTH = 12
PASSWORD_MAX_LENGTH = 128


def normalize_email(raw: str) -> str:
    return raw.strip().lower()


def is_valid_email(normalized: str) -> bool:
    if not EMAIL_MIN_LENGTH <= len(normalized) <= EMAIL_MAX_LENGTH:
        return False
    if any(ch.isspace() for ch in normalized) or normalized.count("@") != 1:
        return False
    local, domain = normalized.split("@")
    return bool(local) and "." in domain[1:-1]
