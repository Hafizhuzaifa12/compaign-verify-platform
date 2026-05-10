"""User profile columns and user_media table (idempotent).

Revision ID: 20260501_01
Revises:
Create Date: 2026-05-01

From `backend-core`: `alembic upgrade head` (DATABASE_URL or `.env`).

Safe alongside `main._ensure_user_profile_columns` thanks to IF NOT EXISTS / column checks.
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy import inspect, text

revision: str = "20260501_01"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    dialect = bind.dialect.name
    ts = sa.TIMESTAMP(timezone=True) if dialect == "postgresql" else sa.TIMESTAMP()

    insp = inspect(bind)
    if "users" in insp.get_table_names():
        cols = {c["name"] for c in insp.get_columns("users")}
        if "full_name" not in cols:
            op.add_column("users", sa.Column("full_name", sa.String(length=200), nullable=True))
        if "phone" not in cols:
            op.add_column("users", sa.Column("phone", sa.String(length=40), nullable=True))
        if "display_name" not in cols:
            op.add_column("users", sa.Column("display_name", sa.String(length=80), nullable=True))
        if "bio" not in cols:
            op.add_column("users", sa.Column("bio", sa.String(length=500), nullable=True))
        if "avatar_path" not in cols:
            op.add_column("users", sa.Column("avatar_path", sa.String(length=512), nullable=True))
        if "created_at" not in cols:
            op.add_column(
                "users",
                sa.Column(
                    "created_at",
                    ts,
                    server_default=sa.text("CURRENT_TIMESTAMP"),
                    nullable=False,
                ),
            )
        if "updated_at" not in cols:
            op.add_column(
                "users",
                sa.Column(
                    "updated_at",
                    ts,
                    server_default=sa.text("CURRENT_TIMESTAMP"),
                    nullable=False,
                ),
            )

    insp = inspect(bind)
    if "users" in insp.get_table_names() and "display_name" in {
        c["name"] for c in insp.get_columns("users")
    }:
        op.execute(text("CREATE UNIQUE INDEX IF NOT EXISTS uq_users_display_name ON users (display_name)"))

    insp = inspect(bind)
    if "user_media" not in insp.get_table_names():
        op.create_table(
            "user_media",
            sa.Column("id", sa.Integer(), nullable=False),
            sa.Column("user_id", sa.Integer(), nullable=False),
            sa.Column("file_path", sa.String(length=512), nullable=False),
            sa.Column("kind", sa.String(length=32), nullable=False),
            sa.Column("sort_order", sa.Integer(), nullable=False),
            sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
            sa.PrimaryKeyConstraint("id"),
        )
        op.create_index(op.f("ix_user_media_id"), "user_media", ["id"], unique=False)
        op.create_index(op.f("ix_user_media_user_id"), "user_media", ["user_id"], unique=False)


def downgrade() -> None:
    bind = op.get_bind()
    insp = inspect(bind)
    if "user_media" in insp.get_table_names():
        op.drop_index(op.f("ix_user_media_user_id"), table_name="user_media")
        op.drop_index(op.f("ix_user_media_id"), table_name="user_media")
        op.drop_table("user_media")
    if "users" in insp.get_table_names():
        op.execute(text("DROP INDEX IF EXISTS uq_users_display_name"))
        cols = {c["name"] for c in insp.get_columns("users")}
        for col in ("updated_at", "created_at", "avatar_path", "bio", "display_name", "phone", "full_name"):
            if col in cols:
                op.drop_column("users", col)
