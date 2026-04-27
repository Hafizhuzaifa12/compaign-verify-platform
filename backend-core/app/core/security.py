import re
from datetime import datetime, timedelta, timezone
from urllib.parse import urlparse

from jose import JWTError, jwt

from app.core.config import settings


def _create_token(
    subject: str, token_type: str, expires_delta: timedelta | None = None
) -> str:
    expire = datetime.now(timezone.utc) + (
        expires_delta
        or timedelta(
            minutes=(
                settings.access_token_expire_minutes
                if token_type == "access"
                else settings.refresh_token_expire_minutes
            )
        )
    )
    payload = {"sub": subject, "exp": expire, "type": token_type}
    return jwt.encode(payload, settings.secret_key, algorithm=settings.algorithm)


def create_access_token(subject: str, expires_delta: timedelta | None = None) -> str:
    return _create_token(subject=subject, token_type="access", expires_delta=expires_delta)


def create_refresh_token(subject: str, expires_delta: timedelta | None = None) -> str:
    return _create_token(
        subject=subject, token_type="refresh", expires_delta=expires_delta
    )


def decode_token(token: str) -> dict:
    try:
        return jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
    except JWTError as exc:
        raise ValueError("Invalid or expired token") from exc


_KNOWN_SHORTENERS: frozenset[str] = frozenset(
    {
        "bit.ly",
        "tinyurl.com",
        "t.co",
        "goo.gl",
        "ow.ly",
        "is.gd",
        "buff.ly",
        "rebrand.ly",
        "short.link",
    }
)
_IPV4_IN_HOST = re.compile(r"^(?:\d{1,3}\.){3}\d{1,3}$")


def check_suspicious_url(url: str) -> bool:
    """
    Return True if URL uses a raw IP host (e.g. 192.168.x.x) or a known link shortener.
    """
    if not url or not str(url).strip():
        return False

    raw = str(url).strip()
    if not re.match(r"^https?://", raw, re.IGNORECASE):
        raw = f"https://{raw}"
    try:
        parsed = urlparse(raw)
        host = parsed.hostname
    except ValueError:
        return True
    if not host:
        return False
    if host.startswith("["):
        return True
    if _IPV4_IN_HOST.match(host):
        return True
    host_l = host.lower()
    for short in _KNOWN_SHORTENERS:
        if host_l == short or host_l.endswith(f".{short}"):
            return True
    return False


_MISLEADING_PHRASES: frozenset[str] = frozenset(
    (
        "verify your account",
        "click here immediately",
        "100% free",
    )
)


def check_misleading_words(text: str) -> list[str]:
    """
    Return human-readable warning strings when known risky phrases appear in the text.
    """
    if not text:
        return []
    lowered = text.lower()
    warnings: list[str] = []
    for phrase in _MISLEADING_PHRASES:
        if phrase in lowered:
            warnings.append(f"Misleading or urgent phrase detected: {phrase!r}")
    return warnings
