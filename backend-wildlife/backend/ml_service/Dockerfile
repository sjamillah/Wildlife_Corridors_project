FROM python:3.11-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Set work directory
WORKDIR /app

# Install system dependencies (curl for health checks)
RUN apt-get update && apt-get install -y \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy entire backend first (ML service needs to be run as package)
COPY . /app/

# Install Python dependencies (from ml_service subdirectory)
RUN pip install --upgrade pip && pip install -r ml_service/requirements.txt

# Create data directory for models
RUN mkdir -p ml_service/data

# Expose port
EXPOSE 8001

# Run FastAPI with uvicorn (run from backend directory as a package)
CMD ["python", "-m", "uvicorn", "ml_service.main:app", "--host", "0.0.0.0", "--port", "8001"]

