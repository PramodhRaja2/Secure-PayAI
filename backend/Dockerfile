# Backend Dockerfile
FROM python:3.10-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
RUN pip install sqlalchemy

COPY . .

# Ensure SQLite DB is in a writable location
ENV DATABASE_URL=sqlite:///./securepay.db

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
