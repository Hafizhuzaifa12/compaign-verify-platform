import re
import logging
import nltk
from nltk.corpus import stopwords

logger = logging.getLogger(__name__)

# ── NLTK bootstrap (safe offline; Dockerfile pre-downloads) ──────────
try:
    nltk.data.find("corpora/stopwords")
except LookupError:
    nltk.download("stopwords", quiet=True)

STOP_WORDS = set(stopwords.words("english"))

# ── Compiled patterns ────────────────────────────────────────────────
URL_PATTERN = re.compile(
    r"https?://[^\s<>\"']+|www\.[^\s<>\"']+", re.IGNORECASE
)
EMAIL_PATTERN = re.compile(
    r"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}"
)
IP_PATTERN = re.compile(r"\b(?:\d{1,3}\.){3}\d{1,3}\b")
HTML_TAG_PATTERN = re.compile(r"<[^>]+>")
PHONE_PATTERN = re.compile(r"\b[\d\-\(\)\+]{7,}\b")
NON_ALPHA_PATTERN = re.compile(r"[^a-z\s]")
MULTI_SPACE_PATTERN = re.compile(r"\s{2,}")


def clean_text_for_vectorizer(text: str) -> str:
    """Prepare text for TF-IDF: lowercase, strip noise, remove stopwords."""
    text = text.lower()
    text = HTML_TAG_PATTERN.sub(" ", text)
    text = URL_PATTERN.sub(" ", text)
    text = EMAIL_PATTERN.sub(" ", text)
    text = IP_PATTERN.sub(" ", text)
    text = PHONE_PATTERN.sub(" ", text)
    text = NON_ALPHA_PATTERN.sub(" ", text)
    text = MULTI_SPACE_PATTERN.sub(" ", text)
    words = [w for w in text.split() if w not in STOP_WORDS and len(w) > 1]
    return " ".join(words)


def extract_raw_signals(text: str) -> dict:
    """Extract structural signals used by the rule engine."""
    urls = URL_PATTERN.findall(text)
    emails = EMAIL_PATTERN.findall(text)
    ips = IP_PATTERN.findall(text)

    ip_in_url = any(IP_PATTERN.search(u) for u in urls)

    total_chars = max(len(text), 1)
    upper_chars = sum(1 for c in text if c.isupper())
    special_chars = sum(1 for c in text if not c.isalnum() and not c.isspace())

    return {
        "urls": urls,
        "url_count": len(urls),
        "emails": emails,
        "email_count": len(emails),
        "ips": ips,
        "ip_in_url": ip_in_url,
        "uppercase_ratio": upper_chars / total_chars,
        "special_char_count": special_chars,
        "text_length": len(text),
        "text_lower": text.lower(),
    }
