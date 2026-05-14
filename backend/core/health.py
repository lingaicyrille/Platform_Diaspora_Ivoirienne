from django.db import connection, OperationalError
from django.core.cache import cache
from django.http import JsonResponse


def health_check(request):
    checks = {}
    http_status = 200

    # Database
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
        checks['database'] = 'ok'
    except OperationalError as exc:
        checks['database'] = f'error: {exc}'
        http_status = 503

    # Cache / Redis
    try:
        cache.set('_health', 1, timeout=5)
        cache.get('_health')
        checks['cache'] = 'ok'
    except Exception as exc:
        checks['cache'] = f'error: {exc}'
        http_status = 503

    return JsonResponse(
        {'status': 'ok' if http_status == 200 else 'degraded', **checks},
        status=http_status,
    )
