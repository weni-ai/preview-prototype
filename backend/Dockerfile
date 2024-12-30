FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first to leverage Docker cache
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application files
COPY . .

# Set environment variables
ENV PYTHONUNBUFFERED=1
ENV TIMEOUT=300

# Expose the port the app runs on
EXPOSE 5000

# Command to run the application using gunicorn with eventlet worker
CMD ["gunicorn", "--worker-class", "eventlet", "--workers", "1", "--timeout", "300", "--bind", "0.0.0.0:5000", "app:app"] 