import re
import uuid
from pathlib import Path

from fastapi import HTTPException, UploadFile, status

from app.core.config import settings

_BACKEND_ROOT = Path(__file__).resolve().parents[2]
_ALLOWED_TYPES = {
    "image/jpeg": ".jpg",
    "image/jpg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "image/gif": ".gif",
}


def uploads_root() -> Path:
    root = _BACKEND_ROOT / settings.upload_subdir
    root.mkdir(parents=True, exist_ok=True)
    (root / "avatars").mkdir(exist_ok=True)
    (root / "media").mkdir(exist_ok=True)
    return root


def extension_for_content_type(content_type: str | None) -> str:
    if not content_type:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Missing image content type",
        )
    key = content_type.split(";")[0].strip().lower()
    ext = _ALLOWED_TYPES.get(key)
    if not ext:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unsupported image type; use JPEG, PNG, WebP, or GIF",
        )
    return ext


async def read_upload_limited(upload: UploadFile) -> tuple[bytes, str]:
    ext = extension_for_content_type(upload.content_type)
    data = await upload.read()
    if len(data) > settings.max_upload_bytes:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File too large (max {settings.max_upload_bytes} bytes)",
        )
    if len(data) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Empty file",
        )
    return data, ext


def safe_relative_filename(subdir: str, ext: str) -> str:
    ext = ext if ext.startswith(".") else f".{ext}"
    name = f"{uuid.uuid4().hex}{ext.lower()}"
    if not re.match(r"^[a-f0-9]{32}\.[a-z0-9]+$", name):
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Could not generate safe filename",
        )
    return f"{subdir.strip('/')}/{name}"


def write_file(relative_path: str, data: bytes) -> None:
    dest = uploads_root() / relative_path.replace("\\", "/")
    dest.parent.mkdir(parents=True, exist_ok=True)
    dest.write_bytes(data)
