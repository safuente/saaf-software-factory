"""Password hashing (Argon2id) and session tokens (ADR-004)."""

import hashlib
import secrets
from functools import cache

from argon2 import PasswordHasher
from argon2.exceptions import InvalidHashError, VerificationError

_hasher = PasswordHasher()  # Argon2id with the library's recommended parameters

TOKEN_BYTES = 32


def hash_password(password: str) -> str:
    return _hasher.hash(password)


@cache
def _unknown_account_hash() -> str:
    return _hasher.hash(secrets.token_urlsafe(TOKEN_BYTES))


def verify_password(password_hash: str | None, password: str) -> bool:
    """Runs a full Argon2 verification even without an account, so timing reveals nothing."""
    try:
        return _hasher.verify(password_hash or _unknown_account_hash(), password) and bool(
            password_hash
        )
    except VerificationError, InvalidHashError:
        return False


def new_session_token() -> str:
    return secrets.token_urlsafe(TOKEN_BYTES)


def hash_session_token(token: str) -> str:
    """One-way hash stored in the database; the raw token exists only in the cookie."""
    return hashlib.sha256(token.encode("utf-8", errors="surrogatepass")).hexdigest()
