FROM python:3.11-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV PIP_NO_CACHE_DIR=1
ENV PIP_DISABLE_PIP_VERSION_CHECK=1

# Set work directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy ML service requirements
COPY requirements.txt /app/

# Install Python dependencies (optimized for speed)
RUN pip install --upgrade pip && \
    pip install --no-cache-dir --compile -r requirements.txt

# Copy ML service code
COPY . /app/

# Create necessary directories
RUN mkdir -p /app/data /app/logs

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Start ML service with uvicorn
CMD uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000} --workers 1
