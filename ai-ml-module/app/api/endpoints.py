import logging
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from app.models.predict import get_model_prediction
from app.models.load_model import get_model, reload_model
from app.core.config import settings

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(name)s %(levelname)s %(message)s",
)

app = FastAPI(title="AI-Powered Campaign Verification API", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class CampaignRequest(BaseModel):
    text: str


@app.get("/health")
async def health():
    return {"status": "ok", "model_loaded": get_model() is not None}


@app.post("/reload")
async def reload():
    ok = reload_model()
    if not ok:
        raise HTTPException(status_code=503, detail="Model reload failed")
    return {"status": "reloaded"}


@app.post("/predict")
async def predict(request: CampaignRequest):
    text = (request.text or "").strip()
    if not text:
        return {"error": "Invalid input text", "label": "Error"}
    if len(text) > settings.MAX_INPUT_LENGTH:
        return {"error": "Input text too long", "label": "Error"}
    try:
        return get_model_prediction(text)
    except Exception as exc:
        logging.getLogger(__name__).exception("Prediction failed: %s", exc)
        return {"error": "Prediction failed", "label": "Error"}
