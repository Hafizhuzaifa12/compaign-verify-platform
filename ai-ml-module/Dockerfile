FROM python:3.9-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

RUN python -c "import nltk; nltk.download('stopwords', quiet=True)"

COPY app/ ./app/
COPY training/ ./training/

RUN python -m training.train

EXPOSE 8001

ENV PYTHONPATH=/app

HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8001/health')" || exit 1

CMD ["uvicorn", "app.api.endpoints:app", "--host", "0.0.0.0", "--port", "8001"]
