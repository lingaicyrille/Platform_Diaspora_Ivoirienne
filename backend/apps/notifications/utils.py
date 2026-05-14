from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer

from .models import Notification, NotificationType


def push_notification(recipient, title, body='', link='', notif_type=NotificationType.GENERAL, sender=None):
    notif = Notification.objects.create(
        recipient=recipient,
        sender=sender,
        type=notif_type,
        title=title,
        body=body,
        link=link,
    )
    channel_layer = get_channel_layer()
    group_name = f'notifications_{recipient.pk}'
    payload = {
        'id': notif.pk,
        'type': notif.type,
        'title': notif.title,
        'body': notif.body,
        'link': notif.link,
        'is_read': False,
        'created_at': notif.created_at.isoformat(),
    }
    try:
        async_to_sync(channel_layer.group_send)(
            group_name,
            {'type': 'send_notification', 'data': payload},
        )
    except Exception:
        pass
    return notif
