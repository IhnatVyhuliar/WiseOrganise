FROM python:3.12-slim
WORKDIR /app
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt
COPY app ./app
COPY prompts ./prompts
COPY tests ./tests
COPY pytest.ini ./pytest.ini
EXPOSE 8000
# --forwarded-allow-ips=* is safe: port 8000 is only exposed on the compose
# network, so Caddy is the only peer that can reach it.
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--proxy-headers", "--forwarded-allow-ips", "*"]
