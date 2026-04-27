import sys
import os
import random
import joblib
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import StratifiedKFold, cross_val_score
from sklearn.metrics import make_scorer, precision_score, recall_score, f1_score

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from app.core.tokenizer import clean_text_for_vectorizer

PHISHING_TEMPLATES = [
    "Dear customer, your account has been suspended due to suspicious activity. Please verify your identity at http://{domain}/verify immediately to restore access.",
    "URGENT: Your {service} account will be terminated within 24 hours. Click here to verify: http://{domain}/login",
    "Security Alert: Unauthorized access detected on your account. Confirm your password at http://{domain}/secure-login now.",
    "Congratulations! You've won a ${amount} gift card. Claim your prize at http://{domain}/claim before it expires.",
    "Your payment of ${amount} has failed. Update your billing information at http://{domain}/billing to avoid service interruption.",
    "Action Required: Your {service} password expires today. Reset it immediately at http://{domain}/reset-password",
    "We detected unusual sign-in activity on your account. If this wasn't you, secure your account at http://{domain}/secure",
    "FINAL WARNING: Your account will be permanently deleted. Verify your identity now: http://{domain}/confirm",
    "Your {service} subscription payment was declined. Update your credit card details at http://{domain}/payment",
    "Important: Please confirm your social security number and date of birth to continue using {service}. Visit http://{domain}/verify-identity",
    "Dear user, your bank account has been locked due to suspicious transactions. Log in at http://{domain}/unlock to restore access.",
    "Urgent action required: Verify your account information within 48 hours or your account will be suspended. http://{domain}/act-now",
    "Your {service} account password has been compromised. Change your password immediately at http://{domain}/change-password",
    "Notice: A refund of ${amount} is pending for your account. Provide your bank details at http://{domain}/refund to process.",
    "WARNING: Multiple failed login attempts detected. Verify your credentials at http://{domain}/verify-login or your account will be locked.",
    "You have an undelivered package. Confirm your shipping address and pay the delivery fee at http://{domain}/delivery",
    "Your {service} account has been flagged for review. Submit your ID verification at http://{domain}/id-verify within 24 hours.",
    "Alert: Your credit card ending in {last4} has been charged ${amount}. If unauthorized, dispute at http://{domain}/dispute",
    "IT Department: Your email storage is full. Click http://{domain}/upgrade to upgrade your account immediately.",
    "Your tax refund of ${amount} is ready. Enter your bank account and routing number at http://{domain}/tax-refund to receive it.",
]

LEGITIMATE_TEMPLATES = [
    "Check out our new spring collection! Shop the latest trends in fashion at our store. Free shipping on orders over $50.",
    "You're invited to our annual customer appreciation event on {date}. RSVP at our website for exclusive deals and giveaways.",
    "Introducing our newest product line designed with quality and sustainability in mind. Learn more on our website.",
    "This week's newsletter: Top 10 tips for {topic}. Plus, exclusive member discounts inside.",
    "Thank you for being a valued customer! Enjoy 20% off your next purchase with code THANKS20.",
    "Join us for a free webinar on {topic} this {day}. Register now to reserve your spot.",
    "New blog post: How to {topic} in 5 easy steps. Read more on our website.",
    "Happy holidays from our team! We're celebrating with our biggest sale of the year. Up to 40% off select items.",
    "Your monthly account statement is ready. Log in to your account to view your transaction history.",
    "We've updated our privacy policy. Review the changes on our website to stay informed.",
    "Exciting news! We're launching in {city}. Be the first to know about our grand opening events.",
    "Your feedback matters! Take our 2-minute survey and help us serve you better.",
    "Season greetings from {company}. Wishing you a wonderful holiday season and a happy new year!",
    "Don't miss our upcoming workshop on {topic}. Limited seats available, register today.",
    "New feature alert: We've added {feature} to make your experience even better. Check it out!",
    "Our customer support team is here to help. Reach out to us anytime at support@ourcompany.com",
    "Weekly digest: The most popular articles from our blog this week. Catch up on what you missed.",
    "Save the date! Our annual conference is coming up on {date}. Early bird tickets available now.",
    "Product update: Version 2.0 is here with improved performance and new features. Update now.",
    "Thank you for your recent purchase! Track your order status on our website.",
]

PHISHING_DOMAINS = [
    "192.168.1.100:8080", "secure-accounts.xyz", "verify-login.tk",
    "account-update.ml", "banking-secure.ga", "paypal-verify.cf",
    "microsoft-support.top", "apple-id-verify.buzz", "google-security.click",
    "amazon-refund.gq", "login-confirm.link", "account-secure.work",
    "update-billing.fit", "secure-signin.review", "verify-now.stream",
]

SERVICES = ["PayPal", "Apple ID", "Microsoft", "Google", "Amazon", "Netflix", "Bank of America", "Chase", "Wells Fargo", "Dropbox"]
AMOUNTS = ["50", "100", "250", "500", "1000", "1500", "2499.99", "99.99"]
TOPICS = ["productivity", "digital marketing", "healthy living", "home improvement", "personal finance", "cooking", "photography"]
DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
DATES = ["March 15th", "April 20th", "May 5th", "June 10th", "September 1st"]
CITIES = ["New York", "San Francisco", "London", "Tokyo", "Berlin"]
COMPANIES = ["TechCo", "GreenLeaf", "BrightPath", "CloudNine", "FreshStart"]
FEATURES = ["dark mode", "two-factor authentication", "offline access", "calendar integration", "team collaboration"]
LAST4 = ["4521", "7890", "1234", "5678", "3456"]


def generate_dataset():
    texts = []
    labels = []

    for template in PHISHING_TEMPLATES:
        for _ in range(5):
            text = template.format(
                domain=random.choice(PHISHING_DOMAINS),
                service=random.choice(SERVICES),
                amount=random.choice(AMOUNTS),
                last4=random.choice(LAST4),
            )
            texts.append(text)
            labels.append("Phishing")

    for template in LEGITIMATE_TEMPLATES:
        for _ in range(5):
            text = template.format(
                topic=random.choice(TOPICS),
                day=random.choice(DAYS),
                date=random.choice(DATES),
                city=random.choice(CITIES),
                company=random.choice(COMPANIES),
                feature=random.choice(FEATURES),
            )
            texts.append(text)
            labels.append("Safe")

    return texts, labels


def train():
    print("Generating synthetic training data...")
    random.seed(42)
    texts, labels = generate_dataset()
    print(f"Dataset: {len(texts)} samples | {labels.count('Phishing')} phishing | {labels.count('Safe')} safe")

    cleaned = [clean_text_for_vectorizer(t) for t in texts]

    vectorizer = TfidfVectorizer(
        max_features=500,
        ngram_range=(1, 2),
        min_df=2,
        sublinear_tf=True,
    )
    X = vectorizer.fit_transform(cleaned)
    y = np.array(labels)

    print(f"Features: {X.shape[1]}")

    model = LogisticRegression(C=1.0, max_iter=1000, random_state=42)

    print("Cross-validation (5-fold):")
    skf = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)

    scorers = {
        "accuracy": "accuracy",
        "precision": make_scorer(precision_score, pos_label="Phishing"),
        "recall": make_scorer(recall_score, pos_label="Phishing"),
        "f1": make_scorer(f1_score, pos_label="Phishing"),
    }

    for name, scorer in scorers.items():
        scores = cross_val_score(model, X, y, cv=skf, scoring=scorer)
        print(f"  {name}: {scores.mean():.4f} (+/- {scores.std():.4f})")

    model.fit(X, y)
    print(f"Classes: {list(model.classes_)}")

    output_dir = os.path.dirname(os.path.abspath(__file__))
    model_path = os.path.join(output_dir, "model.pkl")
    vectorizer_path = os.path.join(output_dir, "vectorizer.pkl")

    joblib.dump(model, model_path)
    joblib.dump(vectorizer, vectorizer_path)

    print(f"model.pkl: {os.path.getsize(model_path)} bytes")
    print(f"vectorizer.pkl: {os.path.getsize(vectorizer_path)} bytes")
    print("Done.")


if __name__ == "__main__":
    train()
