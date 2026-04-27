import os
import sys
import random
import joblib
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.svm import LinearSVC
from sklearn.ensemble import GradientBoostingClassifier, VotingClassifier
from sklearn.calibration import CalibratedClassifierCV
from sklearn.model_selection import StratifiedKFold, cross_val_score
from sklearn.metrics import classification_report

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from app.core.tokenizer import clean_input_text

PHISHING_TEMPLATES = [
    "Dear {target}, your {account} has been {action}. Click here to {resolve}: {url}",
    "URGENT: Your {account} shows {issue}. {resolve} immediately at {url}",
    "{greeting}! You've won {prize}! Claim now: {url}",
    "Your {service} payment of {amount} failed. Update billing info: {url}",
    "Security alert: {issue} detected on your {account}. Verify identity: {url}",
    "{greeting}, we noticed {issue} on your {account}. Please {resolve}: {url}",
    "Congratulations {target}! You have been selected for {prize}. Act now: {url}",
    "FINAL WARNING: Your {account} will be {consequence} unless you {resolve}: {url}",
    "ACTION REQUIRED: {issue} on your {account}. Confirm details here: {url}",
    "Your {service} account password expires today. Reset now: {url}",
    "IMPORTANT: Verify your {account} to avoid {consequence}. {url}",
    "Dear valued {target}, unusual sign-in to your {account}. Secure it: {url}",
    "Wire transfer of {amount} pending your confirmation. Approve here: {url}",
    "Your {service} subscription is expiring. Renew with special offer: {url}",
    "Alert: Your credit card ending in {digits} has been charged {amount}. Dispute: {url}",
    "Hi {target}, please confirm your social security number for {service}: {url}",
    "Unlock your {prize} - limited time offer exclusively for you! {url}",
    "Your package from {service} could not be delivered. Confirm address: {url}",
    "IT Department: Your email storage is full. Click to expand: {url}",
    "Invoice #{digits} attached. Review payment details: {url}",
    "Your {account} login credentials need to be updated. {resolve}: {url}",
    "Dear {target}, {service} has detected {issue}. Immediate {resolve} needed: {url}",
    "ATTENTION: {issue} reported on {account}. Failure to {resolve} will result in {consequence}. {url}",
    "Free {prize} for the first 100 respondents! Hurry: {url}",
    "Your {service} account has been locked due to {issue}. Unlock: {url}",
    "You received a secure document from {service}. View it here: {url}",
    "Tax refund of {amount} approved. Submit bank details to receive: {url}",
    "Your {account} will be deleted in 24 hours. Prevent this: {url}",
    "Unusual {issue} from unknown device on your {account}. Was this you? {url}",
    "{greeting}, your {service} reward of {amount} is ready. Redeem now: {url}",
]

SAFE_TEMPLATES = [
    "Check out our new {product} collection! {discount} off this {period}.",
    "Join us for our annual {event} on {date}.",
    "Your monthly newsletter: Top {number} {topic} tips for {year}.",
    "We've updated our {policy}. Review the changes on our website.",
    "Thank you for your purchase! Your order #{digits} has shipped.",
    "Introducing our new {product} line - designed for {audience}.",
    "Save the date: {event} happening {date} at {location}.",
    "This week's blog: How to improve your {topic} in {number} steps.",
    "Your {service} subscription has been renewed successfully. Thank you!",
    "Happy {holiday}! Enjoy {discount} off with code {code}.",
    "We value your feedback - take our {number}-minute survey.",
    "New feature alert: {product} now supports {feature}.",
    "Reminder: Your appointment is scheduled for {date}.",
    "Welcome to our community! Here's what's new this month.",
    "Our {event} was a success! Thank you to all {number} attendees.",
    "{product} tips and tricks: Getting the most out of your experience.",
    "This month in review: Updates from the {service} team.",
    "We're hiring! Join our {team} team. Apply on our careers page.",
    "Your {service} usage report for {period} is ready to view.",
    "Community spotlight: How {audience} are using {product} for {topic}.",
    "Season's greetings from the {service} family. Wishing you a wonderful {holiday}!",
    "Our {product} just won {event} award! Thank you for your support.",
    "Explore {number} new {topic} courses added to your {service} library.",
    "You're invited to our exclusive {event} on {date} at {location}.",
    "Great news: {product} is now available in {number} new regions.",
    "Your weekly digest: {topic} trends and {product} insights.",
    "Meet the team behind {product} in our latest blog post.",
    "Referral program: Share {service} with friends and earn {discount} credit.",
    "Your {service} plan renews on {date}. No action needed.",
    "Just released: The {year} {topic} report from {service}.",
]

PHISHING_FILL = {
    'target': ['customer', 'user', 'member', 'valued customer', 'account holder', 'sir/madam'],
    'account': ['PayPal account', 'bank account', 'email account', 'Apple ID',
                'Microsoft account', 'Netflix account', 'Amazon account', 'Google account',
                'Dropbox account', 'LinkedIn account', 'Instagram account', 'WhatsApp account'],
    'action': ['suspended', 'locked', 'compromised', 'restricted', 'flagged', 'limited',
               'deactivated', 'frozen', 'placed on hold'],
    'resolve': ['verify your identity', 'confirm your information', 'update your details',
                'reset your password', 'secure your account', 'validate your credentials',
                'confirm your ownership', 'authenticate your profile'],
    'url': ['http://192.168.1.1/verify', 'http://secure-update.tk/login',
            'https://amaz0n-security.xyz/confirm', 'http://paypa1.ml/account',
            'http://micros0ft.ga/reset', 'http://verify-account.click/now',
            'http://bank-secure.pw/update', 'https://login-portal.cc/auth',
            'http://account-verify.top/secure', 'http://update-info.link/confirm',
            'http://10.0.0.1/secure', 'http://nettflix-billing.tk/pay',
            'http://app1e-support.gq/verify', 'http://g00gle-alert.cf/check'],
    'issue': ['unauthorized access', 'suspicious activity', 'unusual login attempt',
              'a security breach', 'unrecognized transaction', 'failed verification',
              'multiple failed sign-in attempts', 'a policy violation'],
    'greeting': ['Congratulations', 'Dear customer', 'Attention', 'Hello valued member',
                 'Dear user', 'Notice', 'Important notice'],
    'prize': ['a $1000 gift card', 'an iPhone 15 Pro', 'a free vacation',
              '$500 cashback', 'a luxury prize', '$10,000 cash', 'a new MacBook',
              'a $250 Amazon voucher'],
    'service': ['PayPal', 'Netflix', 'Amazon', 'Microsoft', 'Apple', 'Google',
                'Bank of America', 'Chase', 'Wells Fargo', 'Citibank', 'DHL', 'FedEx'],
    'amount': ['$49.99', '$199.00', '$500.00', '$1,299.99', '$85.00', '$2,500.00', '$750.00'],
    'consequence': ['permanently closed', 'terminated', 'deleted',
                    'suspended indefinitely', 'reported to authorities'],
    'digits': ['4832', '7291', '5618', '3947', '8120', '6043', '1579'],
}

SAFE_FILL = {
    'product': ['summer fashion', 'home decor', 'fitness gear', 'kitchen gadget',
                'tech accessory', 'skincare', 'organic food', 'smart home', 'outdoor gear'],
    'discount': ['20%', '15%', '30%', '25%', '10%', '40%', '35%'],
    'period': ['weekend', 'month', 'season', 'week', 'quarter', 'holiday season'],
    'event': ['tech conference', 'charity fundraiser', 'product launch', 'webinar',
              'workshop', 'meetup', 'hackathon', 'summit', 'expo'],
    'date': ['January 15th', 'March 22nd', 'June 10th', 'September 5th',
             'December 1st', 'April 18th', 'November 30th', 'August 8th'],
    'number': ['5', '7', '10', '3', '12', '8', '15', '20'],
    'topic': ['productivity', 'wellness', 'marketing', 'design', 'leadership',
              'cooking', 'finance', 'technology', 'sustainability', 'data science'],
    'year': ['2024', '2025', '2026'],
    'policy': ['privacy policy', 'terms of service', 'cookie policy', 'refund policy',
               'community guidelines'],
    'digits': ['10482', '29371', '38291', '47120', '56839', '73041', '82156'],
    'audience': ['professionals', 'students', 'creators', 'teams', 'families',
                 'developers', 'entrepreneurs', 'educators'],
    'location': ['Downtown Convention Center', 'City Hall', 'our main office',
                 'the community center', 'Grand Ballroom', 'Tech Campus'],
    'service': ['cloud storage', 'project management', 'email marketing', 'CRM',
                'analytics', 'productivity suite', 'design platform'],
    'feature': ['dark mode', 'team collaboration', 'mobile app', 'AI suggestions',
                'bulk export', 'real-time sync', 'custom dashboards'],
    'holiday': ['holidays', 'New Year', 'Thanksgiving', 'Black Friday', 'Cyber Monday'],
    'code': ['SAVE20', 'WELCOME10', 'HOLIDAY30', 'SPECIAL15', 'VIP25', 'SUMMER40'],
    'team': ['engineering', 'marketing', 'design', 'data science', 'product', 'sales'],
}


def _fill(template, fill_dict):
    result = template
    for key, values in fill_dict.items():
        tag = '{' + key + '}'
        while tag in result:
            result = result.replace(tag, random.choice(values), 1)
    return result


def generate_dataset(n_per_class=800):
    texts, labels = [], []
    for _ in range(n_per_class):
        texts.append(_fill(random.choice(PHISHING_TEMPLATES), PHISHING_FILL))
        labels.append("Phishing")
    for _ in range(n_per_class):
        texts.append(_fill(random.choice(SAFE_TEMPLATES), SAFE_FILL))
        labels.append("Safe")
    return texts, labels


def main():
    random.seed(42)
    np.random.seed(42)

    print("Generating synthetic dataset ...")
    texts, labels = generate_dataset(n_per_class=800)
    cleaned = [clean_input_text(t) for t in texts]

    vectorizer = TfidfVectorizer(
        max_features=5000,
        ngram_range=(1, 2),
        min_df=2,
        max_df=0.95,
        sublinear_tf=True,
    )
    X = vectorizer.fit_transform(cleaned)
    y = np.array(labels)

    lr = LogisticRegression(C=1.0, max_iter=1000, solver='lbfgs')
    svc = CalibratedClassifierCV(LinearSVC(C=1.0, max_iter=2000), cv=3)
    gb = GradientBoostingClassifier(n_estimators=120, max_depth=4, random_state=42)

    ensemble = VotingClassifier(
        estimators=[('lr', lr), ('svc', svc), ('gb', gb)],
        voting='soft',
    )

    print("Cross-validating ...")
    skf = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
    scores = cross_val_score(ensemble, X, y, cv=skf, scoring='f1_macro')
    print(f"CV F1-macro: {scores.mean():.4f} +/- {scores.std():.4f}")

    print("Training final model ...")
    ensemble.fit(X, y)
    print("\n" + classification_report(y, ensemble.predict(X)))

    out_dir = os.path.dirname(os.path.abspath(__file__))
    joblib.dump(ensemble, os.path.join(out_dir, "model.pkl"))
    joblib.dump(vectorizer, os.path.join(out_dir, "vectorizer.pkl"))
    print(f"Saved to {out_dir}")


if __name__ == "__main__":
    main()
