from app.models.load_model import model, vectorizer
from app.core.tokenizer import clean_input_text

def get_model_prediction(text: str):
    # IDENTITY CHECK: if model is None
    if model is None or vectorizer is None:
        return None, 0.0

    cleaned = clean_input_text(text)
    vectorized = vectorizer.transform([cleaned])
    
    prediction = model.predict(vectorized)[0]
    probabilities = model.predict_proba(vectorized)[0]
    confidence = max(probabilities)
    
    return prediction, confidence
