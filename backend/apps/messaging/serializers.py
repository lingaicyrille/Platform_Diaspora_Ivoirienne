from drf_spectacular.utils import extend_schema_field
from rest_framework import serializers
from .models import Conversation, Message


class SenderSerializer(serializers.Serializer):
    id = serializers.IntegerField(read_only=True)
    first_name = serializers.CharField(read_only=True)
    last_name = serializers.CharField(read_only=True)


class ParticipantSerializer(serializers.Serializer):
    id = serializers.IntegerField(read_only=True)
    first_name = serializers.CharField(read_only=True)
    last_name = serializers.CharField(read_only=True)
    avatar = serializers.ImageField(read_only=True)


class MessageSerializer(serializers.ModelSerializer):
    sender = SenderSerializer(read_only=True)
    is_read = serializers.SerializerMethodField()

    class Meta:
        model = Message
        fields = ['id', 'conversation', 'sender', 'content', 'read_by', 'sent_at', 'is_read']

    @extend_schema_field(serializers.BooleanField())
    def get_is_read(self, obj):
        request = self.context.get('request')
        if request and request.user and request.user.is_authenticated:
            return obj.read_by.filter(pk=request.user.pk).exists()
        return False


class ConversationSerializer(serializers.ModelSerializer):
    participants = ParticipantSerializer(many=True, read_only=True)
    last_message = serializers.SerializerMethodField()
    unread_count = serializers.SerializerMethodField()

    class Meta:
        model = Conversation
        fields = [
            'id', 'participants', 'is_group', 'name',
            'created_at', 'last_message', 'unread_count',
        ]

    @extend_schema_field(MessageSerializer(allow_null=True))
    def get_last_message(self, obj):
        last = obj.messages.last()
        if last is None:
            return None
        return MessageSerializer(last, context=self.context).data

    @extend_schema_field(serializers.IntegerField())
    def get_unread_count(self, obj):
        request = self.context.get('request')
        if request and request.user and request.user.is_authenticated:
            return obj.messages.exclude(read_by=request.user).count()
        return 0
