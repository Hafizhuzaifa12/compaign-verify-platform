from fastapi import FastAPI
from pydantic import BaseModel
from app.models.predict import get_model_prediction

app = FastAPI(title="AI-Powered Campaign Verification API")

class CampaignRequest(BaseModel):
    text: str

@app.post("/predict")
async def predict(request: CampaignRequest):
    if not request.text or not request.text.strip():
        return {"error": "Invalid input text", "label": "Error"}

    pred, conf = get_model_prediction(request.text)
    
    # Corrected thresholds for both Phishing and Safe branches
    label = "Suspicious" 
    
    if pred == "Phishing":
        label = "High Risk" if conf > 0.70 else "Suspicious"
    elif pred == "Safe":
        label = "Safe" if conf > 0.70 else "Suspicious"

    return {
        "label": label,
        "confidence": round(float(conf), 4),
        "original_prediction": pred
    }
