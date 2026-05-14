#!/bin/bash
set -e

echo "Waiting for PostgreSQL..."
until python -c "
import os, psycopg2
psycopg2.connect(os.environ['DATABASE_URL'])
" 2>/dev/null; do
    echo "  PostgreSQL not ready — retrying in 2s"
    sleep 2
done
echo "PostgreSQL ready."

python manage.py migrate --noinput
python manage.py collectstatic --noinput

exec python manage.py runserver 0.0.0.0:8000
