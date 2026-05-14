import sys
import os
import logging
import joblib
import numpy as np
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import StratifiedKFold, cross_val_score, train_test_split
from sklearn.metrics import classification_report, f1_score

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from app.core.tokenizer import clean_text_for_vectorizer

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)

MAX_TEXT_LENGTH = 50_000
MIN_TEXT_LENGTH = 10
OUTPUT_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.dirname(OUTPUT_DIR)


def load_phishing_dataset():
    """
    Load ONLY the Phishing_Email.csv dataset — the sole domain-relevant source.
    
    Other datasets (Fake news, Clickbait, LIAR) have been removed because:
    - Fake/True news articles have zero linguistic overlap with phishing emails
    - Clickbait headlines are manipulative but NOT phishing
    - LIAR political fact-checks are irrelevant to campaign verification
    
    Training on irrelevant data pollutes the decision boundary and inflates
    reported metrics without improving real-world phishing detection.
    """
    texts = []
    labels = []

    p_csv = os.environ.get(
        "DATASET_PATH",
        os.path.join(DATA_DIR, "Phishing_Email.csv")
    )

    if not os.path.exists(p_csv):
        raise FileNotFoundError(f"Dataset not found: {p_csv}")

    logger.info("Loading Phishing_Email.csv ...")
    df = pd.read_csv(p_csv, low_memory=False)

    # Drop unnamed index columns if present
    df = df.drop(columns=[c for c in df.columns if 'Unnamed' in c], errors='ignore')

    if 'Email Text' not in df.columns or 'Email Type' not in df.columns:
        raise ValueError("Dataset must have 'Email Text' and 'Email Type' columns")

    # ── Data Cleaning ────────────────────────────────────────────────────
    initial_count = len(df)

    # Drop rows with missing text or label
    df = df.dropna(subset=['Email Text', 'Email Type'])

    # Map labels to binary classes
    label_map = {"Phishing Email": "Phishing", "Safe Email": "Safe"}
    df['label'] = df['Email Type'].map(label_map)
    df = df.dropna(subset=['label'])

    # Remove empty or too-short texts
    df['Email Text'] = df['Email Text'].astype(str).str.strip()
    df = df[df['Email Text'].str.len() >= MIN_TEXT_LENGTH]

    # Remove exact duplicates (text + label)
    df = df.drop_duplicates(subset=['Email Text', 'label'])

    # Truncate extremely long texts
    df['Email Text'] = df['Email Text'].str[:MAX_TEXT_LENGTH]

    texts = df['Email Text'].tolist()
    labels = df['label'].tolist()

    dropped = initial_count - len(texts)
    logger.info(f"Loaded {len(texts)} clean samples (dropped {dropped} invalid/duplicate rows)")
    logger.info(f"  Phishing: {labels.count('Phishing')} | Safe: {labels.count('Safe')}")
    logger.info(f"  Class ratio (Safe:Phishing): {labels.count('Safe')/max(labels.count('Phishing'),1):.2f}:1")

    if not texts:
        raise ValueError("No valid data after cleaning. Check dataset.")

    return texts, labels


def train():
    texts, labels = load_phishing_dataset()

    # ── Text Preprocessing ───────────────────────────────────────────────
    logger.info("Cleaning and preprocessing text ...")
    cleaned = [clean_text_for_vectorizer(t) for t in texts]

    # Remove samples where cleaning produced empty strings
    valid_indices = [i for i, c in enumerate(cleaned) if c.strip()]
    if len(valid_indices) < len(cleaned):
        logger.info(f"Removed {len(cleaned) - len(valid_indices)} samples with empty cleaned text")
        cleaned = [cleaned[i] for i in valid_indices]
        labels = [labels[i] for i in valid_indices]

    # ── TF-IDF Vectorization ─────────────────────────────────────────────
    logger.info("Vectorizing with TF-IDF ...")
    vectorizer = TfidfVectorizer(
        max_features=50_000,
        ngram_range=(1, 2),
        min_df=3,
        max_df=0.95,
        sublinear_tf=True,
    )
    X = vectorizer.fit_transform(cleaned)
    y = np.array(labels)
    logger.info("Feature matrix: %d samples × %d features", X.shape[0], X.shape[1])

    # ── Train/Test Split ─────────────────────────────────────────────────
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.20, random_state=42, stratify=y,
    )
    logger.info("Train: %d samples | Test: %d samples", X_train.shape[0], X_test.shape[0])

    # ── Cross-Validation ─────────────────────────────────────────────────
    logger.info("Running 5-fold stratified cross-validation ...")
    skf = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)

    cv_f1 = cross_val_score(
        LogisticRegression(C=1.0, max_iter=1000, solver="lbfgs",
                           class_weight="balanced", random_state=42),
        X_train, y_train, cv=skf, scoring="f1_weighted", n_jobs=-1,
    )
    logger.info("CV F1 scores: %s", [f"{s:.4f}" for s in cv_f1])
    logger.info("CV F1 mean: %.4f (±%.4f)", cv_f1.mean(), cv_f1.std())

    # ── Final Model Training ─────────────────────────────────────────────
    logger.info("Training final Logistic Regression (class_weight='balanced') ...")
    lr = LogisticRegression(
        C=1.0,
        max_iter=1000,
        solver="lbfgs",
        class_weight="balanced",
        random_state=42,
    )
    lr.fit(X_train, y_train)

    # ── Hold-out Evaluation ──────────────────────────────────────────────
    y_pred = lr.predict(X_test)
    report = classification_report(y_test, y_pred)
    f1 = f1_score(y_test, y_pred, pos_label="Phishing")
    logger.info("Hold-out test results:\n%s", report)
    logger.info("Phishing F1-Score: %.4f", f1)

    # ── Save Artifacts ───────────────────────────────────────────────────
    model_path = os.path.join(OUTPUT_DIR, "model.pkl")
    vectorizer_path = os.path.join(OUTPUT_DIR, "vectorizer.pkl")

    joblib.dump(lr, model_path)
    joblib.dump(vectorizer, vectorizer_path)

    logger.info("Saved: %s (%.1f KB)", model_path, os.path.getsize(model_path) / 1024)
    logger.info("Saved: %s (%.1f KB)", vectorizer_path, os.path.getsize(vectorizer_path) / 1024)
    logger.info("Classes: %s", list(lr.classes_))
    logger.info("Training complete ✓")


if __name__ == "__main__":
    train()
