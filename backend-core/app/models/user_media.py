from sqlalchemy import Column, ForeignKey, Integer, String

from app.db.base import Base


class UserMedia(Base):
    """Additional profile images (banner, gallery). Primary avatar path lives on `User.avatar_path`."""

    __tablename__ = "user_media"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    file_path = Column(String(512), nullable=False)
    kind = Column(String(32), nullable=False)
    sort_order = Column(Integer, default=0, nullable=False)
