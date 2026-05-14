from django.utils import timezone
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import Event, RSVP
from .serializers import EventSerializer, RSVPSerializer


class EventViewSet(viewsets.ModelViewSet):
    queryset = Event.objects.all().select_related('organizer').prefetch_related('rsvps')
    serializer_class = EventSerializer
    permission_classes = [IsAuthenticated]

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context

    def perform_create(self, serializer):
        serializer.save(organizer=self.request.user)

    def get_queryset(self):
        queryset = super().get_queryset()
        category = self.request.query_params.get('category')
        city = self.request.query_params.get('city')
        is_online = self.request.query_params.get('is_online')
        upcoming = self.request.query_params.get('upcoming')

        if category:
            queryset = queryset.filter(category=category)
        if city:
            queryset = queryset.filter(city__icontains=city)
        if is_online is not None:
            queryset = queryset.filter(is_online=is_online.lower() in ('true', '1', 'yes'))
        if upcoming == 'true':
            queryset = queryset.filter(start_datetime__gte=timezone.now())
        return queryset

    @action(detail=True, methods=['post'])
    def rsvp(self, request, pk=None):
        event = self.get_object()
        rsvp_status = request.data.get('status', 'going')
        rsvp, created = RSVP.objects.update_or_create(
            event=event,
            user=request.user,
            defaults={'status': rsvp_status},
        )
        serializer = RSVPSerializer(rsvp)
        status_code = status.HTTP_201_CREATED if created else status.HTTP_200_OK
        return Response(serializer.data, status=status_code)


class RSVPViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = RSVP.objects.all().select_related('user', 'event')
    serializer_class = RSVPSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = super().get_queryset()
        event_id = self.request.query_params.get('event')
        if event_id is not None:
            queryset = queryset.filter(event__id=event_id)
        return queryset
