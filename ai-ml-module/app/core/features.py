import re

_URL_RE = re.compile(
    r'https?://[^\s<>"\']+|www\.[^\s<>"\']+',
    re.IGNORECASE,
)
_EMAIL_RE = re.compile(
    r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}',
    re.IGNORECASE,
)
_IP_URL_RE = re.compile(r'https?://\d{1,3}(\.\d{1,3}){3}')

SUSPICIOUS_TLDS = frozenset({
    '.tk', '.ml', '.ga', '.cf', '.gq', '.xyz', '.top',
    '.click', '.link', '.pw', '.cc', '.buzz', '.rest',
})

URGENCY_KEYWORDS = frozenset({
    'urgent', 'immediately', 'expire', 'hurry', 'deadline',
    'last chance', 'act now', 'limited time', 'final warning',
    'suspended', 'unauthorized', 'security breach',
    'locked', 'disabled', 'action required',
})

PHISHING_REGEXES = [
    re.compile(p, re.IGNORECASE) for p in [
        r'click\s+here',
        r'verify\s+your\s+(account|identity|password|email)',
        r'confirm\s+your\s+(account|identity|password|email)',
        r'update\s+your\s+(account|payment|billing|information)',
        r'suspend(ed)?\s+account',
        r'unusual\s+(activity|sign[\s-]?in|login)',
        r'reset\s+your\s+password',
        r'won\s+(a\s+)?(prize|lottery|gift|reward)',
        r'claim\s+your\s*(prize|reward|gift|bonus)',
        r'free\s+(gift|money|iphone|prize|offer)',
        r'wire\s+transfer',
        r'social\s+security',
        r'credit\s+card\s+(number|detail|info)',
        r'bank\s+(account|detail|info)',
        r'dear\s+(customer|user|member|valued)',
        r'you\s+have\s+been\s+selected',
        r'log\s*-?\s*in\s+credential',
    ]
]


def extract_features(text: str) -> dict:
    lower = text.lower()
    urls = _URL_RE.findall(text)
    url_count = len(urls)
    has_ip_url = bool(_IP_URL_RE.search(text))

    suspicious_tld_count = 0
    for u in urls:
        for tld in SUSPICIOUS_TLDS:
            if tld in u.lower():
                suspicious_tld_count += 1
                break

    email_count = len(_EMAIL_RE.findall(text))
    urgency_count = sum(1 for kw in URGENCY_KEYWORDS if kw in lower)
    phishing_hits = sum(1 for rx in PHISHING_REGEXES if rx.search(lower))

    alpha_count = max(sum(1 for c in text if c.isalpha()), 1)
    caps_ratio = sum(1 for c in text if c.isupper()) / alpha_count
    total_len = max(len(text), 1)
    special_ratio = sum(1 for c in text if not c.isalnum() and not c.isspace()) / total_len

    return {
        'url_count': url_count,
        'email_count': email_count,
        'has_ip_url': has_ip_url,
        'suspicious_tld_count': suspicious_tld_count,
        'urgency_count': urgency_count,
        'phishing_hits': phishing_hits,
        'caps_ratio': round(caps_ratio, 4),
        'special_ratio': round(special_ratio, 4),
        'exclamation_count': text.count('!'),
        'dollar_count': text.count('$'),
        'text_length': len(text),
    }


def compute_rule_score(features: dict) -> float:
    s = 0.0

    if features['has_ip_url']:
        s += 0.20
    if features['suspicious_tld_count'] > 0:
        s += min(features['suspicious_tld_count'] * 0.12, 0.36)
    if features['url_count'] > 3:
        s += 0.12
    elif features['url_count'] > 0:
        s += 0.04

    hits = features['phishing_hits']
    if hits >= 3:
        s += 0.30
    elif hits >= 1:
        s += min(hits * 0.12, 0.24)

    urg = features['urgency_count']
    if urg >= 3:
        s += 0.20
    elif urg >= 1:
        s += min(urg * 0.08, 0.16)

    if features['caps_ratio'] > 0.5:
        s += 0.08
    if features['exclamation_count'] > 3:
        s += 0.04
    if features['dollar_count'] > 2:
        s += 0.04
    if features['special_ratio'] > 0.25:
        s += 0.04

    return min(s, 1.0)
