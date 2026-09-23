#!/bin/sh
set -e

python manage.py migrate --noinput
python manage.py collectstatic --noinput

if [ "$DJANGO_SUPERUSER_USERNAME" ] && [ "$DJANGO_SUPERUSER_PASSWORD" ] && [ "$DJANGO_SUPERUSER_EMAIL" ]; then
  python manage.py createsuperuser --noinput || true
fi

if [ "$DJANGO_DEBUG" = "true" ]; then
  exec python manage.py runserver 0.0.0.0:8000
else
  exec gunicorn config.wsgi:application --bind 0.0.0.0:8000 --workers 3
fi
