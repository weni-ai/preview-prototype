FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Copy requirements first to leverage Docker cache
COPY requirements.txt .

# Install dependencies
RUN pip install -r requirements.txt

# Copy the rest of the application
COPY . .

# Set environment variables
ENV PORT=5000

# Command to run the application
CMD gunicorn --worker-class eventlet -w 1 app:app --bind 0.0.0.0:$PORT 