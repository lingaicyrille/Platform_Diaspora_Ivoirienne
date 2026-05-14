from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import Conversation, Message
from .serializers import ConversationSerializer, MessageSerializer


class ConversationViewSet(viewsets.ModelViewSet):
    serializer_class = ConversationSerializer
    permission_classes = [IsAuthenticated]
    http_method_names = ['get', 'post', 'delete', 'head', 'options']

    def get_queryset(self):
        if getattr(self, 'swagger_fake_view', False):
            return Conversation.objects.none()
        return (
            Conversation.objects
            .filter(participants=self.request.user)
            .prefetch_related('messages', 'participants')
        )

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context

    def perform_create(self, serializer):
        conversation = serializer.save()
        conversation.participants.add(self.request.user)
        participant_ids = self.request.data.get('participant_ids', [])
        if participant_ids:
            conversation.participants.add(*participant_ids)

    @action(detail=True, methods=['get'])
    def messages(self, request, pk=None):
        conversation = self.get_object()
        qs = conversation.messages.select_related('sender').prefetch_related('read_by')
        page = self.paginate_queryset(qs)
        if page is not None:
            serializer = MessageSerializer(page, many=True, context={'request': request})
            return self.get_paginated_response(serializer.data)
        serializer = MessageSerializer(qs, many=True, context={'request': request})
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def send(self, request, pk=None):
        conversation = self.get_object()
        content = request.data.get('content', '').strip()
        if not content:
            return Response(
                {'detail': 'Le contenu du message est obligatoire.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        message = Message.objects.create(
            conversation=conversation,
            sender=request.user,
            content=content,
        )
        message.read_by.add(request.user)
        serializer = MessageSerializer(message, context={'request': request})
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class MessageViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = MessageSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        if getattr(self, 'swagger_fake_view', False):
            return Message.objects.none()
        qs = (
            Message.objects
            .filter(conversation__participants=self.request.user)
            .select_related('sender', 'conversation')
            .prefetch_related('read_by')
        )
        conversation_id = self.request.query_params.get('conversation')
        if conversation_id is not None:
            qs = qs.filter(conversation__id=conversation_id)
        return qs

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context
