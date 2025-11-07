FROM python:3.11-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV DISABLE_LOCAL_ML=True

# Set work directory
WORKDIR /app

# Install system dependencies (with retry and alternative mirrors)
RUN apt-get update --allow-releaseinfo-change || true && \
    apt-get install -y \
    postgresql-client \
    curl \
    || apt-get install -y --no-install-recommends \
    postgresql-client \
    curl \
    || echo "Skipping optional packages" && \
    rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt /app/

RUN pip install --upgrade pip && pip install -r requirements.txt

# Copy project
COPY . /app/

# Create necessary directories
RUN mkdir -p /app/logs /app/staticfiles /app/media

# Collect static files
RUN python manage.py collectstatic --noinput

# Run migrations, create superuser if needed, and start server
CMD python manage.py migrate && \
    python manage.py create_superuser && \
    gunicorn wildlife_backend.wsgi:application --bind 0.0.0.0:${PORT:-8000} --workers 1 --timeout 180 --max-requests 1000 --max-requests-jitter 50 --graceful-timeout 30

