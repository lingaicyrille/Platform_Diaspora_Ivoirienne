from rest_framework import serializers

from .models import Notification


class SenderMinimalSerializer(serializers.Serializer):
    id = serializers.IntegerField(read_only=True)
    first_name = serializers.CharField(read_only=True)
    last_name = serializers.CharField(read_only=True)


class NotificationSerializer(serializers.ModelSerializer):
    sender = SenderMinimalSerializer(read_only=True)

    class Meta:
        model = Notification
        fields = [
            'id', 'sender', 'type', 'title', 'body',
            'link', 'is_read', 'created_at',
        ]
        read_only_fields = fields
