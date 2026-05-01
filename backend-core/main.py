from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy import inspect, text

from app.api.v1.api import api_router
from app.core.config import settings
from app.core.file_storage import uploads_root
from app.db.base import Base
from app.db.session import engine

app = FastAPI(title="Campaign Verify Platform API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(api_router, prefix="/api/v1")
_upload_root = str(uploads_root())
app.mount("/uploads", StaticFiles(directory=_upload_root), name="uploads")


@app.on_event("startup")
def startup() -> None:
    # Create tables automatically from SQLAlchemy models.
    Base.metadata.create_all(bind=engine)
    _ensure_user_profile_columns()
    _ensure_campaign_columns()


@app.get("/")
def read_root() -> dict[str, str]:
    return {"message": "Hello World"}


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "healthy"}


def _ensure_user_profile_columns() -> None:
    """
    Additive schema for `users` when reusing older DB volumes (mirrors campaign guard).
    Avatar and extra images are stored as relative paths under `upload_subdir`; URLs are `/uploads/...`.
    """
    inspector = inspect(engine)
    table_names = inspector.get_table_names()
    if "users" not in table_names:
        return

    existing = {c["name"] for c in inspector.get_columns("users")}
    ts = "TIMESTAMPTZ" if engine.dialect.name == "postgresql" else "TIMESTAMP"
    need_display_unique_index = "display_name" not in existing
    alter_statements: list[str] = []
    if "full_name" not in existing:
        alter_statements.append("ALTER TABLE users ADD COLUMN full_name VARCHAR(200)")
    if "phone" not in existing:
        alter_statements.append("ALTER TABLE users ADD COLUMN phone VARCHAR(40)")
    if "display_name" not in existing:
        alter_statements.append("ALTER TABLE users ADD COLUMN display_name VARCHAR(80)")
    if "bio" not in existing:
        alter_statements.append("ALTER TABLE users ADD COLUMN bio VARCHAR(500)")
    if "avatar_path" not in existing:
        alter_statements.append("ALTER TABLE users ADD COLUMN avatar_path VARCHAR(512)")
    if "created_at" not in existing:
        alter_statements.append(
            f"ALTER TABLE users ADD COLUMN created_at {ts} NOT NULL DEFAULT CURRENT_TIMESTAMP"
        )
    if "updated_at" not in existing:
        alter_statements.append(
            f"ALTER TABLE users ADD COLUMN updated_at {ts} NOT NULL DEFAULT CURRENT_TIMESTAMP"
        )

    with engine.begin() as conn:
        for stmt in alter_statements:
            conn.execute(text(stmt))
        if need_display_unique_index:
            conn.execute(
                text("CREATE UNIQUE INDEX IF NOT EXISTS uq_users_display_name ON users (display_name)")
            )


def _ensure_campaign_columns() -> None:
    """
    Lightweight schema guard for environments without Alembic migrations.
    Keeps startup resilient when older DB volumes are reused.
    """
    inspector = inspect(engine)
    table_names = inspector.get_table_names()
    if "campaigns" not in table_names:
        return

    existing = {c["name"] for c in inspector.get_columns("campaigns")}
    alter_statements = []
    if "ai_label" not in existing:
        alter_statements.append("ALTER TABLE campaigns ADD COLUMN ai_label VARCHAR")
    if "ai_confidence" not in existing:
        alter_statements.append("ALTER TABLE campaigns ADD COLUMN ai_confidence DOUBLE PRECISION")
    if "risk_score" not in existing:
        alter_statements.append("ALTER TABLE campaigns ADD COLUMN risk_score DOUBLE PRECISION")
    if "trust_score" not in existing:
        alter_statements.append("ALTER TABLE campaigns ADD COLUMN trust_score DOUBLE PRECISION")
    if "blockchain_network" not in existing:
        alter_statements.append("ALTER TABLE campaigns ADD COLUMN blockchain_network VARCHAR")

    if not alter_statements:
        return

    with engine.begin() as conn:
        for stmt in alter_statements:
            conn.execute(text(stmt))
