from fastapi import FastAPI

from app.api.v1.api import api_router
from app.db.base import Base
from app.db.session import engine

app = FastAPI(title="Campaign Verify Platform API")
app.include_router(api_router)


@app.on_event("startup")
def startup() -> None:
    # Create tables automatically from SQLAlchemy models.
    Base.metadata.create_all(bind=engine)


@app.get("/")
def read_root() -> dict[str, str]:
    return {"message": "Hello World"}
