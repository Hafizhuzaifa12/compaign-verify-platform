from sqlalchemy import Column, ForeignKey, Integer, String, Text

from app.db.base import Base


class Campaign(Base):
    __tablename__ = "campaigns"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String, nullable=False)
    campaign_type = Column("type", String, nullable=False)  # form field "type"
    content = Column(Text, nullable=False)
    url = Column(String, default="", nullable=True)
    status = Column(String, default="Pending", nullable=False)
    security_warnings = Column(Text, nullable=True)  # JSON list of strings
    tx_hash = Column(String, nullable=True)
    content_hash_sha256 = Column(String(64), nullable=True)  # hex digest, optional for audit
    marketing_tips = Column(Text, nullable=True)  # JSON array of strings
