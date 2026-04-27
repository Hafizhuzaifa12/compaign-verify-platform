URGENCY_KEYWORDS = [
    "immediately", "urgent", "suspend", "suspended", "verify now",
    "act now", "action required", "urgent action", "expire", "expires",
    "within 24 hours", "within 48 hours", "limited time", "right away",
    "as soon as possible", "final warning", "last chance",
    "account will be", "will be closed", "will be suspended",
    "unauthorized", "unusual activity", "security alert", "security notice",
]

CREDENTIAL_KEYWORDS = [
    "password", "passwd", "ssn", "social security", "credit card",
    "bank account", "account number", "routing number", "pin number",
    "login", "log in", "sign in", "username", "credential",
    "billing information", "payment information", "card number",
    "cvv", "expiry date", "date of birth",
]

SUSPICIOUS_TLDS = [
    ".xyz", ".tk", ".ml", ".ga", ".cf", ".top", ".buzz", ".click",
    ".gq", ".link", ".work", ".fit", ".review", ".stream",
    ".download", ".racing", ".win", ".bid", ".loan", ".trade",
]

PHISHING_DOMAIN_FRAGMENTS = [
    "secure-", "account-", "login-", "verify-", "update-", "confirm-",
    "banking-", "paypal-", "apple-", "microsoft-", "google-", "amazon-",
    "-secure", "-login", "-verify", "-account", "-update", "-confirm",
    "signin", "logon", "authenticate",
]


def compute_rule_score(signals):
    score = 0.0
    indicators = []

    text_lower = signals.get("text_lower", "")
    urls = signals.get("urls", [])

    if signals.get("ip_in_url", False):
        score += 0.30
        indicators.append("ip_address_in_url")

    tld_hits = 0
    for url in urls:
        url_lower = url.lower()
        for tld in SUSPICIOUS_TLDS:
            if tld in url_lower:
                tld_hits += 1
                break
    if tld_hits > 0:
        score += min(tld_hits * 0.15, 0.30)
        indicators.append(f"suspicious_tld_x{tld_hits}")

    frag_hits = 0
    for url in urls:
        url_lower = url.lower()
        for frag in PHISHING_DOMAIN_FRAGMENTS:
            if frag in url_lower:
                frag_hits += 1
                break
    if frag_hits > 0:
        score += min(frag_hits * 0.10, 0.20)
        indicators.append(f"phishing_domain_fragment_x{frag_hits}")

    urgency_hits = 0
    for keyword in URGENCY_KEYWORDS:
        if keyword in text_lower:
            urgency_hits += 1
    if urgency_hits > 0:
        score += min(urgency_hits * 0.05, 0.20)
        indicators.append(f"urgency_keywords_x{urgency_hits}")

    cred_hits = 0
    for keyword in CREDENTIAL_KEYWORDS:
        if keyword in text_lower:
            cred_hits += 1
    if cred_hits > 0:
        score += min(cred_hits * 0.10, 0.25)
        indicators.append(f"credential_keywords_x{cred_hits}")

    if signals.get("url_count", 0) > 3:
        score += 0.10
        indicators.append(f"high_url_count_{signals['url_count']}")

    if signals.get("email_count", 0) > 0:
        score += 0.05
        indicators.append("email_in_body")

    score = max(0.0, min(1.0, score))

    return score, indicators
