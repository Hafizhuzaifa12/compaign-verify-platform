import re
import nltk
from nltk.corpus import stopwords

nltk.download('stopwords', quiet=True)
STOP_WORDS = set(stopwords.words('english'))

URL_PATTERN = re.compile(r'https?://[^\s<>"\']+|www\.[^\s<>"\']+', re.IGNORECASE)
EMAIL_PATTERN = re.compile(r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}')
IP_PATTERN = re.compile(r'\b(?:\d{1,3}\.){3}\d{1,3}\b')
HTML_TAG_PATTERN = re.compile(r'<[^>]+>')


def clean_text_for_vectorizer(text):
    text = text.lower()
    text = HTML_TAG_PATTERN.sub('', text)
    words = text.split()
    cleaned = [w for w in words if w not in STOP_WORDS]
    return " ".join(cleaned)


def extract_raw_signals(text):
    urls = URL_PATTERN.findall(text)
    emails = EMAIL_PATTERN.findall(text)
    ips = IP_PATTERN.findall(text)

    ip_in_url = False
    for url in urls:
        if IP_PATTERN.search(url):
            ip_in_url = True
            break

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
