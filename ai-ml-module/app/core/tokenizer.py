import re
import nltk
from nltk.corpus import stopwords

# Pre-download to ensure cold-starts are fast
nltk.download('stopwords', quiet=True)
STOP_WORDS = set(stopwords.words('english'))

def clean_input_text(text):
    text = text.lower()
    text = re.sub(r'<.*?>', '', text) # Strip HTML [cite: 57]
    words = text.split()
    cleaned = [w for w in words if w not in STOP_WORDS]
    return " ".join(cleaned)
