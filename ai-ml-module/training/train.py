import sys
import os
import logging
import joblib
import numpy as np
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import StratifiedKFold, cross_val_score, train_test_split
from sklearn.metrics import classification_report

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from app.core.tokenizer import clean_text_for_vectorizer

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)

MAX_TEXT_LENGTH = 50_000
OUTPUT_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.dirname(OUTPUT_DIR)

def load_and_merge_datasets():
    texts = []
    labels = []
    
    def add_data(new_texts, new_labels):
        for t, l in zip(new_texts, new_labels):
            if pd.isna(t) or not str(t).strip(): continue
            texts.append(str(t)[:MAX_TEXT_LENGTH])
            labels.append(l)

    # 1. Phishing_Email.csv
    p_csv = os.environ.get(
        "DATASET_PATH",
        os.path.join(DATA_DIR, "Phishing_Email.csv")
    )
    if os.path.exists(p_csv):
        df = pd.read_csv(p_csv, low_memory=False)
        if 'Email Text' in df.columns and 'Email Type' in df.columns:
            df = df.dropna(subset=['Email Text', 'Email Type'])
            label_map = {"Phishing Email": "Phishing", "Safe Email": "Safe"}
            df['label'] = df['Email Type'].map(label_map)
            df = df.dropna(subset=['label'])
            add_data(df['Email Text'], df['label'])
            logger.info(f"Loaded {len(df)} from Phishing_Email.csv")

    cd_dir = os.path.join(DATA_DIR, "datasets of CD")
    
    # 2. Fake.csv
    fake_csv = os.path.join(cd_dir, "News _dataset", "Fake.csv")
    if os.path.exists(fake_csv):
        df = pd.read_csv(fake_csv, low_memory=False)
        if 'title' in df.columns and 'text' in df.columns:
            df['combined_text'] = df['title'].astype(str) + " " + df['text'].astype(str)
            add_data(df['combined_text'], ["Phishing"] * len(df))
            logger.info(f"Loaded {len(df)} from Fake.csv")

    # 3. True.csv
    true_csv = os.path.join(cd_dir, "News _dataset", "True.csv")
    if os.path.exists(true_csv):
        df = pd.read_csv(true_csv, low_memory=False)
        if 'title' in df.columns and 'text' in df.columns:
            df['combined_text'] = df['title'].astype(str) + " " + df['text'].astype(str)
            add_data(df['combined_text'], ["Safe"] * len(df))
            logger.info(f"Loaded {len(df)} from True.csv")

    # 4. clickbait_data.csv
    cb_csv = os.path.join(cd_dir, "clickbait_data.csv")
    if os.path.exists(cb_csv):
        df = pd.read_csv(cb_csv, low_memory=False)
        if 'headline' in df.columns and 'clickbait' in df.columns:
            df = df.dropna(subset=['headline', 'clickbait'])
            add_data(df['headline'], df['clickbait'].map({1: "Phishing", 0: "Safe"}))
            logger.info(f"Loaded {len(df)} from clickbait_data.csv")

    # 5. LIAR dataset (tsv/txt)
    liar_files = [
        os.path.join(cd_dir, "train.txt"),
        os.path.join(cd_dir, "valid.txt"),
        os.path.join(cd_dir, "test.txt"),
        os.path.join(cd_dir, "archive (2)", "train.tsv"),
        os.path.join(cd_dir, "archive (2)", "valid.tsv"),
        os.path.join(cd_dir, "archive (2)", "test.tsv")
    ]
    for f in liar_files:
        if os.path.exists(f):
            try:
                sep = '\t' if f.endswith('.tsv') else ','
                df = pd.read_csv(f, sep=sep, header=None, on_bad_lines='skip', engine='python')
                if len(df.columns) > 2:
                    df = df.dropna(subset=[1, 2])
                    label_map = {
                        "false": "Phishing", "pants-fire": "Phishing", "barely-true": "Phishing",
                        "half-true": "Phishing", "mostly-true": "Safe", "true": "Safe"
                    }
                    df['label'] = df[1].map(label_map)
                    df = df.dropna(subset=['label'])
                    add_data(df[2], df['label'])
                    logger.info(f"Loaded {len(df)} from {os.path.basename(f)}")
            except Exception as e:
                logger.warning(f"Failed to load {f}: {e}")

    if not texts:
        raise ValueError("No data could be loaded. Please check the dataset paths.")

    logger.info(f"Total dataset: {len(texts)} samples | {labels.count('Phishing')} Phishing | {labels.count('Safe')} Safe")
    return texts, labels

def train():
    texts, labels = load_and_merge_datasets()

    logger.info("Cleaning text ...")
    cleaned = [clean_text_for_vectorizer(t) for t in texts]

    logger.info("Vectorizing ...")
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

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.20, random_state=42, stratify=y,
    )
    
    logger.info("Training Logistic Regression model ...")
    lr = LogisticRegression(C=1.0, max_iter=1000, solver="lbfgs", random_state=42)
    lr.fit(X_train, y_train)

    y_pred = lr.predict(X_test)
    report = classification_report(y_test, y_pred)
    logger.info("Hold-out test results:\n%s", report)

    model_path = os.path.join(OUTPUT_DIR, "model.pkl")
    vectorizer_path = os.path.join(OUTPUT_DIR, "vectorizer.pkl")

    joblib.dump(lr, model_path)
    joblib.dump(vectorizer, vectorizer_path)

    logger.info("Classes: %s", list(lr.classes_))
    logger.info("Done.")

if __name__ == "__main__":
    train()
