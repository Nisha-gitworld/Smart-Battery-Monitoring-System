# ==============================================================================
# Multi-stage Dockerfile: Unified React Frontend + Flask Backend
# Compatible with Render ($PORT / 10000) & Hugging Face Spaces (Port 7860)
# ==============================================================================

# ----------------- Stage 1: Build React Frontend -----------------
FROM node:18-alpine AS frontend-builder
WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm install

COPY frontend/ ./
ENV REACT_APP_API_URL=""
RUN npm run build

# ----------------- Stage 2: Runtime Backend & Host -----------------
FROM python:3.11-slim
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Python requirements
COPY requirements-api.txt ./requirements.txt
RUN pip install --no-cache-dir --upgrade pip setuptools wheel && \
    pip install --no-cache-dir -r requirements.txt

# Copy backend application code, models, data
COPY . .

# Copy built frontend assets from Stage 1 into frontend/build
COPY --from=frontend-builder /app/frontend/build /app/frontend/build

# Setup user (Hugging Face Spaces UID 1000 compatibility)
RUN useradd -m -u 1000 user && \
    chown -R user:user /app
USER user

# Support dynamic port assignment (Render uses $PORT, Hugging Face uses 7860)
ENV PORT=7860
EXPOSE 7860 10000

CMD sh -c "gunicorn backend.api:app --bind 0.0.0.0:${PORT:-7860} --workers 2 --timeout 120"
