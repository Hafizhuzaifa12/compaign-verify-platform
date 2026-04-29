"""
Train a phishing-detection classifier on the Phishing_Email.csv dataset.

Usage (standalone):   python -m training.train
Usage (Docker):       RUN python -m training.train   (in Dockerfile)

The script:
  1. Loads the CSV dataset (columns: Email Text, Email Type).
  2. Cleans text via the shared tokenizer.
  3. Trains a soft-voting ensemble (LogisticRegression + LinearSVC + GBM).
  4. Reports stratified 5-fold CV metrics.
  5. Saves model.pkl + vectorizer.pkl to the training/ directory.
"""

import sys
import os
import logging
import joblib
import numpy as np
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.svm import LinearSVC
from sklearn.ensemble import GradientBoostingClassifier, VotingClassifier
from sklearn.calibration import CalibratedClassifierCV
from sklearn.model_selection import StratifiedKFold, cross_val_score, train_test_split
from sklearn.metrics import classification_report, make_scorer, f1_score

# ── Make project root importable ─────────────────────────────────────
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from app.core.tokenizer import clean_text_for_vectorizer

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)

# ── Constants ────────────────────────────────────────────────────────
LABEL_MAP = {
    "Phishing Email": "Phishing",
    "Safe Email": "Safe",
}
TEXT_COL = "Email Text"
LABEL_COL = "Email Type"
MAX_TEXT_LENGTH = 50_000          # truncate extreme outliers
OUTPUT_DIR = os.path.dirname(os.path.abspath(__file__))


def load_dataset(csv_path: str) -> tuple:
    """Load CSV, clean nulls, map labels, truncate extreme texts."""
    logger.info("Loading dataset from %s", csv_path)
    df = pd.read_csv(csv_path, low_memory=False)

    required = {TEXT_COL, LABEL_COL}
    if not required.issubset(df.columns):
        raise ValueError(f"CSV must contain columns {required}, got {list(df.columns)}")

    # Drop rows with missing text
    before = len(df)
    df = df.dropna(subset=[TEXT_COL])
    df = df[df[TEXT_COL].astype(str).str.strip().astype(bool)]
    logger.info("Dropped %d rows with empty/null text", before - len(df))

    # Map labels
    df[LABEL_COL] = df[LABEL_COL].map(LABEL_MAP)
    unknown = df[LABEL_COL].isna().sum()
    if unknown > 0:
        logger.warning("Dropping %d rows with unmapped labels", unknown)
        df = df.dropna(subset=[LABEL_COL])

    # Truncate extreme outlier texts
    df[TEXT_COL] = df[TEXT_COL].astype(str).str[:MAX_TEXT_LENGTH]

    texts = df[TEXT_COL].tolist()
    labels = df[LABEL_COL].tolist()
    logger.info("Dataset: %d samples | %d Phishing | %d Safe",
                len(texts), labels.count("Phishing"), labels.count("Safe"))
    return texts, labels


def train():
    """Full training pipeline: load → clean → vectorize → train → save."""
    csv_path = os.environ.get(
        "DATASET_PATH",
        os.path.join(os.path.dirname(OUTPUT_DIR), "Phishing_Email.csv"),
    )
    if not os.path.exists(csv_path):
        raise FileNotFoundError(f"Dataset not found at {csv_path}")

    # ── Load & prepare ───────────────────────────────────────────────
    texts, labels = load_dataset(csv_path)

    logger.info("Cleaning text ...")
    cleaned = [clean_text_for_vectorizer(t) for t in texts]

    # ── Vectorize ────────────────────────────────────────────────────
    vectorizer = TfidfVectorizer(
        max_features=10_000,
        ngram_range=(1, 2),
        min_df=3,
        max_df=0.95,
        sublinear_tf=True,
    )
    X = vectorizer.fit_transform(cleaned)
    y = np.array(labels)
    logger.info("Feature matrix: %d samples × %d features", X.shape[0], X.shape[1])

    # ── Train / test split (hold-out for final eval) ─────────────────
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.20, random_state=42, stratify=y,
    )
    logger.info("Train: %d | Test: %d", X_train.shape[0], X_test.shape[0])

    # ── Build ensemble ───────────────────────────────────────────────
    lr = LogisticRegression(C=1.0, max_iter=1000, solver="lbfgs", random_state=42)
    svc = CalibratedClassifierCV(
        LinearSVC(C=1.0, max_iter=3000, random_state=42), cv=3
    )
    gb = GradientBoostingClassifier(
        n_estimators=150, max_depth=4, learning_rate=0.1, random_state=42
    )

    ensemble = VotingClassifier(
        estimators=[("lr", lr), ("svc", svc), ("gb", gb)],
        voting="soft",
    )

    # ── Cross-validation on training set ─────────────────────────────
    logger.info("Cross-validating (5-fold) ...")
    skf = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
    f1_scorer = make_scorer(f1_score, pos_label="Phishing")
    cv_scores = cross_val_score(ensemble, X_train, y_train, cv=skf, scoring=f1_scorer)
    logger.info("CV F1 (Phishing): %.4f ± %.4f", cv_scores.mean(), cv_scores.std())

    # ── Final fit on full training set ───────────────────────────────
    logger.info("Training final model on full train set ...")
    ensemble.fit(X_train, y_train)

    # ── Hold-out evaluation ──────────────────────────────────────────
    y_pred = ensemble.predict(X_test)
    report = classification_report(y_test, y_pred)
    logger.info("Hold-out test results:\n%s", report)

    # ── Save artifacts ───────────────────────────────────────────────
    model_path = os.path.join(OUTPUT_DIR, "model.pkl")
    vectorizer_path = os.path.join(OUTPUT_DIR, "vectorizer.pkl")

    joblib.dump(ensemble, model_path)
    joblib.dump(vectorizer, vectorizer_path)

    logger.info("model.pkl     : %d bytes", os.path.getsize(model_path))
    logger.info("vectorizer.pkl: %d bytes", os.path.getsize(vectorizer_path))
    logger.info("Classes: %s", list(ensemble.classes_))
    logger.info("Done.")


if __name__ == "__main__":
    train()
