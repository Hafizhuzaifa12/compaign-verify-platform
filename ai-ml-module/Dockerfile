FROM python:3.11-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

ENV PYTHONPATH=/app

COPY requirements.txt .
RUN pip install --index-url https://pypi.tuna.tsinghua.edu.cn/simple \
    --default-timeout=1000 \
    --no-cache-dir -r requirements.txt

RUN python -c "import nltk; nltk.download('stopwords', quiet=True)"

COPY app/ ./app/
COPY training/ ./training/
COPY Phishing_Email.csv .

EXPOSE 8001



CMD ["uvicorn", "app.api.endpoints:app", "--host", "0.0.0.0", "--port", "8001"]
