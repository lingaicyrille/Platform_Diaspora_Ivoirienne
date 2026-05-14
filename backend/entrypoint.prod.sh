#!/bin/bash
set -e

echo "==> Running Django migrations..."
python manage.py migrate --noinput

echo "==> Collecting static files..."
python manage.py collectstatic --noinput --clear

echo "==> Starting Gunicorn (uvicorn workers, ASGI)..."
exec gunicorn config.asgi:application \
  --worker-class uvicorn.workers.UvicornWorker \
  --workers "${GUNICORN_WORKERS:-2}" \
  --bind 0.0.0.0:8000 \
  --timeout "${GUNICORN_TIMEOUT:-120}" \
  --keep-alive "${GUNICORN_KEEPALIVE:-5}" \
  --log-level "${LOG_LEVEL:-info}" \
  --access-logfile - \
  --error-logfile -
