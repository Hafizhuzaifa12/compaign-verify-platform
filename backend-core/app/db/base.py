from sqlalchemy.orm import declarative_base

Base = declarative_base()

# Ensure model classes are registered on Base metadata.
from app.models import campaign, user  # noqa: E402,F401
