import re
from typing import Any

from fastapi import APIRouter, Depends, File, Form, HTTPException, Request, UploadFile, status
from pydantic import BaseModel, ConfigDict, Field, field_validator
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.file_storage import read_upload_limited, safe_relative_filename, write_file
from app.core.config import settings
from app.db.session import get_db
from app.models.user import User
from app.models.user_media import UserMedia

router = APIRouter(prefix="/users", tags=["users"])

_phone_re = re.compile(r"^\+?[0-9][0-9\s\-]{5,38}$")
_MEDIA_KINDS = frozenset({"banner", "gallery"})


def _public_base(request: Request) -> str:
    if settings.public_app_url:
        return settings.public_app_url.rstrip("/")
    return str(request.base_url).rstrip("/")


def _file_public_url(request: Request, relative: str | None) -> str | None:
    if not relative:
        return None
    rel = relative.replace("\\", "/").lstrip("/")
    return f"{_public_base(request)}/uploads/{rel}"


def _user_media_rows(db: Session, user_id: int) -> list[UserMedia]:
    return (
        db.query(UserMedia)
        .filter(UserMedia.user_id == user_id)
        .order_by(UserMedia.sort_order.asc(), UserMedia.id.asc())
        .all()
    )


def _serialize_user(request: Request, user: User, db: Session) -> dict[str, Any]:
    needs = not (user.full_name and user.full_name.strip())
    media = _user_media_rows(db, int(user.id))
    return {
        "id": user.id,
        "email": user.email,
        "full_name": user.full_name or "",
        "phone": user.phone,
        "display_name": user.display_name,
        "bio": user.bio,
        "avatar_path": user.avatar_path,
        "avatar_url": _file_public_url(request, user.avatar_path),
        "needs_profile_completion": needs,
        "created_at": user.created_at.isoformat() if user.created_at else None,
        "updated_at": user.updated_at.isoformat() if user.updated_at else None,
        "media": [
            {
                "id": m.id,
                "url": _file_public_url(request, m.file_path),
                "path": m.file_path,
                "kind": m.kind,
                "sort_order": m.sort_order,
            }
            for m in media
        ],
    }


class UserMeUpdate(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    full_name: str | None = Field(default=None, min_length=1, max_length=200)
    phone: str | None = Field(default=None, max_length=40)
    display_name: str | None = Field(default=None, max_length=80)
    bio: str | None = Field(default=None, max_length=500)

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, v: str | None) -> str | None:
        if v is None or v == "":
            return None
        compact = re.sub(r"[\s\-]", "", v)
        if not _phone_re.match(v) or len(compact) < 7:
            raise ValueError("Invalid phone number")
        return v

    @field_validator("display_name")
    @classmethod
    def empty_display_to_none(cls, v: str | None) -> str | None:
        if v is None or v.strip() == "":
            return None
        return v.strip()


@router.get("/me")
def get_me(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    return _serialize_user(request, current_user, db)


@router.patch("/me")
def patch_me(
    request: Request,
    payload: UserMeUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    data = payload.model_dump(exclude_unset=True)

    if "display_name" in data:
        dn = data["display_name"]
        if dn is not None:
            taken = (
                db.query(User)
                .filter(User.display_name == dn, User.id != current_user.id)
                .first()
            )
            if taken:
                raise HTTPException(status_code=400, detail="Display name already taken")

    if "full_name" in data and data["full_name"] is not None:
        current_user.full_name = data["full_name"].strip()
    if "phone" in data:
        current_user.phone = data["phone"]
    if "display_name" in data:
        current_user.display_name = data["display_name"]
    if "bio" in data:
        raw_bio = data["bio"]
        if raw_bio is None:
            current_user.bio = None
        else:
            current_user.bio = raw_bio.strip() or None

    db.add(current_user)
    db.commit()
    db.refresh(current_user)
    return _serialize_user(request, current_user, db)


@router.post("/me/avatar", status_code=status.HTTP_200_OK)
async def upload_avatar(
    request: Request,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    data, ext = await read_upload_limited(file)
    relative = safe_relative_filename("avatars", ext)
    write_file(relative, data)
    current_user.avatar_path = relative
    db.add(current_user)
    db.commit()
    db.refresh(current_user)
    return _serialize_user(request, current_user, db)


@router.post("/me/media", status_code=status.HTTP_201_CREATED)
async def upload_media(
    request: Request,
    kind: str = Form(...),
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    k = kind.strip().lower()
    if k not in _MEDIA_KINDS:
        raise HTTPException(
            status_code=400,
            detail=f"kind must be one of: {', '.join(sorted(_MEDIA_KINDS))}",
        )
    data, ext = await read_upload_limited(file)
    relative = safe_relative_filename("media", ext)
    write_file(relative, data)
    max_sort = (
        db.query(func.max(UserMedia.sort_order))
        .filter(UserMedia.user_id == current_user.id)
        .scalar()
    )
    next_order = (max_sort or 0) + 1
    row = UserMedia(user_id=current_user.id, file_path=relative, kind=k, sort_order=next_order)
    db.add(row)
    db.commit()
    db.refresh(row)
    return {
        "id": row.id,
        "url": _file_public_url(request, row.file_path),
        "path": row.file_path,
        "kind": row.kind,
        "sort_order": row.sort_order,
    }
