# Step 1: Use a lightweight Python base image
FROM python:3.9-slim

# Step 2: Set the internal working directory
WORKDIR /app

# Step 3: Install system dependencies for NLTK/SSL if needed
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Step 4: Copy and install Python requirements first (for caching)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Step 5: Copy the modular app code and training artifacts
# We copy everything into the /app folder in the container
COPY app/ ./app/
COPY training/ ./training/

# Step 6: Expose the API port [cite: 64]
EXPOSE 8001

# Step 7: Define the environment variable to ensure imports work
ENV PYTHONPATH=/app

# Step 8: Run the FastAPI server using Uvicorn [cite: 64]
CMD ["uvicorn", "app.api.endpoints:app", "--host", "0.0.0.0", "--port", "8001"]
