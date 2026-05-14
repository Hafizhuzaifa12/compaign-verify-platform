import re

# ══════════════════════════════════════════════════════════════════════
# SIGNAL DICTIONARIES — Used by both phishing detection and campaign
# spam/fraud intent verification.
# ══════════════════════════════════════════════════════════════════════

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

# Campaign-specific spam/fraud indicators — detect campaigns that abuse
# the verification platform to legitimize fraudulent or spammy content.
SPAM_INTENT_KEYWORDS = [
    "guaranteed winner", "you have been selected", "congratulations you won",
    "click below to claim", "claim your prize", "free money",
    "wire transfer", "western union", "money gram", "bitcoin wallet",
    "send money", "pay fee", "processing fee", "advance fee",
    "nigerian prince", "inheritance", "beneficiary",
    "make money fast", "work from home", "earn thousands",
    "no experience needed", "100% free", "risk free", "double your",
    "investment opportunity", "guaranteed returns", "mlm",
    "multi level marketing", "pyramid scheme",
]

IMPERSONATION_KEYWORDS = [
    "official notice from", "government notice", "tax refund",
    "irs notice", "ministry of", "federal reserve",
    "on behalf of the president", "united nations",
    "world health organization", "your package is held",
    "customs clearance", "delivery attempt failed",
]

DECEPTIVE_CAMPAIGN_PATTERNS = [
    "verify your identity", "confirm your account",
    "update your details", "click here to verify",
    "enter your information", "provide your details",
    "reset your password", "recover your account",
    "unlock your account", "reactivate your account",
]

# Regex to extract the domain part from a URL
_DOMAIN_RE = re.compile(
    r"https?://([^/:?#\s]+)", re.IGNORECASE
)


def _extract_domain(url: str) -> str:
    """Return the domain portion of a URL, or the URL itself as fallback."""
    m = _DOMAIN_RE.search(url)
    return m.group(1).lower() if m else url.lower()


def _domain_has_suspicious_tld(domain: str) -> bool:
    """Check if domain *ends* with a suspicious TLD (not substring)."""
    for tld in SUSPICIOUS_TLDS:
        if domain.endswith(tld) or domain.endswith(tld + "/"):
            return True
    return False


def compute_rule_score(signals: dict) -> tuple:
    """
    Compute a 0-1 risk score from structural and semantic signals.
    
    Designed for Campaign Verification: detects phishing, spam, fraud,
    and impersonation attempts in submitted campaign content.
    """
    score = 0.0
    indicators = []

    text_lower = signals.get("text_lower", "")
    urls = signals.get("urls", [])

    # ── IP address in URL ────────────────────────────────────────────
    if signals.get("ip_in_url", False):
        score += 0.30
        indicators.append("ip_address_in_url")

    # ── Suspicious TLD (proper domain-suffix check) ──────────────────
    tld_hits = 0
    for url in urls:
        domain = _extract_domain(url)
        if _domain_has_suspicious_tld(domain):
            tld_hits += 1
    if tld_hits > 0:
        score += min(tld_hits * 0.15, 0.30)
        indicators.append(f"suspicious_tld_x{tld_hits}")

    # ── Phishing domain fragments ────────────────────────────────────
    frag_hits = 0
    for url in urls:
        domain = _extract_domain(url)
        for frag in PHISHING_DOMAIN_FRAGMENTS:
            if frag in domain:
                frag_hits += 1
                break
    if frag_hits > 0:
        score += min(frag_hits * 0.10, 0.20)
        indicators.append(f"phishing_domain_fragment_x{frag_hits}")

    # ── Urgency keywords ─────────────────────────────────────────────
    urgency_hits = sum(1 for kw in URGENCY_KEYWORDS if kw in text_lower)
    if urgency_hits > 0:
        score += min(urgency_hits * 0.05, 0.20)
        indicators.append(f"urgency_keywords_x{urgency_hits}")

    # ── Credential keywords ──────────────────────────────────────────
    cred_hits = sum(1 for kw in CREDENTIAL_KEYWORDS if kw in text_lower)
    if cred_hits > 0:
        score += min(cred_hits * 0.10, 0.25)
        indicators.append(f"credential_keywords_x{cred_hits}")

    # ── Spam/fraud intent (campaign-specific) ─────────────────────────
    spam_hits = sum(1 for kw in SPAM_INTENT_KEYWORDS if kw in text_lower)
    if spam_hits > 0:
        score += min(spam_hits * 0.10, 0.30)
        indicators.append(f"spam_fraud_intent_x{spam_hits}")

    # ── Impersonation signals (campaign-specific) ─────────────────────
    impersonation_hits = sum(1 for kw in IMPERSONATION_KEYWORDS if kw in text_lower)
    if impersonation_hits > 0:
        score += min(impersonation_hits * 0.12, 0.25)
        indicators.append(f"impersonation_x{impersonation_hits}")

    # ── Deceptive campaign patterns (data harvesting campaigns) ───────
    deceptive_hits = sum(1 for kw in DECEPTIVE_CAMPAIGN_PATTERNS if kw in text_lower)
    if deceptive_hits > 0:
        score += min(deceptive_hits * 0.08, 0.20)
        indicators.append(f"deceptive_campaign_x{deceptive_hits}")

    # ── High URL count ───────────────────────────────────────────────
    if signals.get("url_count", 0) > 3:
        score += 0.10
        indicators.append(f"high_url_count_{signals['url_count']}")

    # ── Email in body ────────────────────────────────────────────────
    if signals.get("email_count", 0) > 0:
        score += 0.05
        indicators.append("email_in_body")

    score = max(0.0, min(1.0, score))
    return score, indicators
