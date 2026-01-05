FROM python:3.10-slim

# Prevent Python from writing .pyc files
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Create work directory
WORKDIR /app

# Install dependencies first for caching
COPY requirements.txt /app/
RUN pip install --no-cache-dir -r requirements.txt

# Copy whole project
COPY . /app/

# Expose API port
EXPOSE 8000

# Launch API
CMD ["uvicorn", "api.main:app", "--host", "0.0.0.0", "--port", "8000"]
