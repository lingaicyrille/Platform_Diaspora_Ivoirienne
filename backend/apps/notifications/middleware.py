from urllib.parse import parse_qs

from channels.db import database_sync_to_async
from django.contrib.auth.models import AnonymousUser
from rest_framework_simplejwt.tokens import AccessToken
from rest_framework_simplejwt.exceptions import TokenError


@database_sync_to_async
def get_user_from_token(token_str):
    from django.conf import settings
    from django.contrib.auth import get_user_model
    User = get_user_model()
    try:
        token = AccessToken(token_str)
        return User.objects.get(pk=token['user_id'])
    except (TokenError, User.DoesNotExist, KeyError):
        return AnonymousUser()


class JWTAuthMiddleware:
    """
    Read a JWT access token from the `token` query-string parameter and
    attach the corresponding user to scope['user'].

    Usage (ASGI):
        JWTAuthMiddleware(URLRouter([...]))

    Frontend connection:
        new WebSocket(`ws://host/ws/notifications/?token=${accessToken}`)
    """

    def __init__(self, inner):
        self.inner = inner

    async def __call__(self, scope, receive, send):
        qs = parse_qs(scope.get('query_string', b'').decode())
        token_list = qs.get('token', [])
        if token_list:
            scope['user'] = await get_user_from_token(token_list[0])
        else:
            scope['user'] = AnonymousUser()
        return await self.inner(scope, receive, send)
