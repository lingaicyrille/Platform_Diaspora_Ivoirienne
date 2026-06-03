from django.utils import timezone
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.pagination import PageNumberPagination
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import Event, RSVP
from .serializers import EventSerializer, RSVPSerializer


class StandardPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100


class EventViewSet(viewsets.ModelViewSet):
    queryset = Event.objects.all().select_related('organizer').prefetch_related('rsvps')
    serializer_class = EventSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = StandardPagination

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context

    def perform_create(self, serializer):
        serializer.save(organizer=self.request.user)

    def get_queryset(self):
        queryset = super().get_queryset()
        params = self.request.query_params

        category = params.get('category')
        city = params.get('city')
        continent = params.get('continent')
        is_online = params.get('is_online')
        upcoming = params.get('upcoming')
        date_from = params.get('date_from')
        date_to = params.get('date_to')

        if category:
            queryset = queryset.filter(category=category)
        if city:
            queryset = queryset.filter(city__icontains=city)
        if continent:
            queryset = queryset.filter(organizer__continent=continent)
        if is_online is not None:
            queryset = queryset.filter(is_online=is_online.lower() in ('true', '1', 'yes'))
        if upcoming == 'true':
            queryset = queryset.filter(start_datetime__gte=timezone.now())
        if date_from:
            queryset = queryset.filter(start_datetime__date__gte=date_from)
        if date_to:
            queryset = queryset.filter(start_datetime__date__lte=date_to)

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
    pagination_class = StandardPagination

    def get_queryset(self):
        queryset = super().get_queryset()
        event_id = self.request.query_params.get('event')
        if event_id is not None:
            queryset = queryset.filter(event__id=event_id)
        return queryset
