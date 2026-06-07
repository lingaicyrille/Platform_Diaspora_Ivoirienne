from django.db.models import F
from django.utils import timezone
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.pagination import PageNumberPagination
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import Ad
from .serializers import AdSerializer


class StandardPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100


class AdViewSet(viewsets.ModelViewSet):
    serializer_class = AdSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = StandardPagination

    def get_queryset(self):
        qs = Ad.objects.select_related('advertiser')
        placement = self.request.query_params.get('placement')
        active_only = self.request.query_params.get('active', 'true')
        mine = self.request.query_params.get('mine')

        if mine == 'true':
            qs = qs.filter(advertiser=self.request.user)
        elif active_only.lower() != 'false':
            today = timezone.now().date()
            qs = qs.filter(is_active=True, start_date__lte=today, end_date__gte=today)

        if placement:
            qs = qs.filter(placement=placement)
        return qs

    def perform_create(self, serializer):
        serializer.save(advertiser=self.request.user)

    @action(detail=True, methods=['post'], url_path='track_impression')
    def track_impression(self, request, pk=None):
        Ad.objects.filter(pk=pk).update(impressions=F('impressions') + 1)
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=True, methods=['post'], url_path='track_click')
    def track_click(self, request, pk=None):
        Ad.objects.filter(pk=pk).update(clicks=F('clicks') + 1)
        return Response(status=status.HTTP_204_NO_CONTENT)
