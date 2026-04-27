import re
import nltk
from nltk.corpus import stopwords
from nltk.stem import PorterStemmer

nltk.download('stopwords', quiet=True)
STOP_WORDS = set(stopwords.words('english'))
_stemmer = PorterStemmer()

_URL_RE = re.compile(r'https?://\S+|www\.\S+', re.IGNORECASE)
_EMAIL_RE = re.compile(r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}', re.IGNORECASE)
_HTML_RE = re.compile(r'<[^>]+>')
_NON_ALPHA_RE = re.compile(r'[^a-z\s]')
_MULTI_SPACE_RE = re.compile(r'\s+')


def clean_input_text(text: str) -> str:
    t = text.lower()
    t = _URL_RE.sub(' urltoken ', t)
    t = _EMAIL_RE.sub(' emailtoken ', t)
    t = _HTML_RE.sub(' ', t)
    t = _NON_ALPHA_RE.sub(' ', t)
    t = _MULTI_SPACE_RE.sub(' ', t).strip()
    words = t.split()
    cleaned = [_stemmer.stem(w) for w in words if w not in STOP_WORDS and len(w) > 1]
    return " ".join(cleaned)
