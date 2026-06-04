import json

from channels.db import database_sync_to_async
from channels.generic.websocket import AsyncWebsocketConsumer


class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        user = self.scope.get('user')
        if user is None or not user.is_authenticated:
            await self.close()
            return

        self.conversation_id = self.scope['url_route']['kwargs']['conversation_id']
        self.group_name = f'chat_{self.conversation_id}'

        is_participant = await self.check_participant(user.pk, self.conversation_id)
        if not is_participant:
            await self.close()
            return

        self.user = user
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, code):
        if hasattr(self, 'group_name'):
            await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def receive(self, text_data=None, bytes_data=None):
        try:
            data = json.loads(text_data or '{}')
        except json.JSONDecodeError:
            return

        content = data.get('content', '').strip()
        if not content:
            return

        message = await self.save_message(content)

        await self.channel_layer.group_send(
            self.group_name,
            {
                'type': 'chat_message',
                'message': message,
            },
        )

    async def chat_message(self, event):
        await self.send(text_data=json.dumps(event['message']))

    @database_sync_to_async
    def check_participant(self, user_pk, conversation_id):
        from .models import Conversation
        return Conversation.objects.filter(
            id=conversation_id,
            participants__pk=user_pk,
        ).exists()

    @database_sync_to_async
    def save_message(self, content):
        from .models import Conversation, Message
        conversation = Conversation.objects.get(id=self.conversation_id)
        msg = Message.objects.create(
            conversation=conversation,
            sender=self.user,
            content=content,
        )
        msg.read_by.add(self.user)
        return {
            'id': msg.id,
            'sender': {
                'id': self.user.id,
                'first_name': self.user.first_name,
                'last_name': self.user.last_name,
            },
            'content': msg.content,
            'sent_at': msg.sent_at.isoformat(),
            'is_read': True,
        }
