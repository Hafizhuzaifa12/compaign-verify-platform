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
HTML_ENTITY_PATTERN = re.compile(r"&[a-zA-Z]+;|&#\d+;")
PHONE_PATTERN = re.compile(r"\b[\d\-\(\)\+]{7,}\b")
BASE64_PATTERN = re.compile(r"[A-Za-z0-9+/]{20,}={0,2}")
REPEATED_CHAR_PATTERN = re.compile(r"(.)\1{4,}")
NON_ALPHA_PATTERN = re.compile(r"[^a-z\s]")
MULTI_SPACE_PATTERN = re.compile(r"\s{2,}")


def clean_text_for_vectorizer(text: str) -> str:
    """
    Prepare text for TF-IDF vectorization with thorough preprocessing:
    1. Lowercase
    2. Strip HTML tags and entities
    3. Replace URLs/emails/IPs/phones with semantic tokens (preserves signal)
    4. Remove base64 blobs and repeated characters (noise)
    5. Strip non-alphabetic characters
    6. Remove stopwords and single-character tokens
    """
    if not text or not text.strip():
        return ""

    text = text.lower()

    # Remove HTML markup and entities
    text = HTML_TAG_PATTERN.sub(" ", text)
    text = HTML_ENTITY_PATTERN.sub(" ", text)

    # Replace structured data with semantic tokens (order matters)
    text = URL_PATTERN.sub(" specialtokenurl ", text)
    text = EMAIL_PATTERN.sub(" specialtokenemail ", text)
    text = IP_PATTERN.sub(" specialtokenip ", text)
    text = PHONE_PATTERN.sub(" specialtokenphone ", text)

    # Remove noise: base64 blobs, repeated chars
    text = BASE64_PATTERN.sub(" ", text)
    text = REPEATED_CHAR_PATTERN.sub(r"\1", text)

    # Strip non-alpha (keeps spaces and letters only)
    text = NON_ALPHA_PATTERN.sub(" ", text)

    # Collapse whitespace
    text = MULTI_SPACE_PATTERN.sub(" ", text).strip()

    # Remove stopwords and very short tokens
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
