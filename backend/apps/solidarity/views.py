from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.notifications.utils import push_notification
from apps.notifications.models import NotificationType
from .models import SolidarityFund, SolidarityContribution
from .serializers import (
    SolidarityFundSerializer,
    SolidarityFundDetailSerializer,
    SolidarityContributionSerializer,
)


class SolidarityFundViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = SolidarityFund.objects.select_related('creator').prefetch_related('contributions')
        category = self.request.query_params.get('category')
        fund_status = self.request.query_params.get('status')
        if category:
            qs = qs.filter(category=category)
        if fund_status:
            qs = qs.filter(status=fund_status)
        return qs

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return SolidarityFundDetailSerializer
        return SolidarityFundSerializer

    def perform_create(self, serializer):
        serializer.save(creator=self.request.user)

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        ctx['request'] = self.request
        return ctx

    @action(detail=True, methods=['post'])
    def contribute(self, request, pk=None):
        fund = self.get_object()
        if fund.status != 'active':
            return Response(
                {'detail': "Ce fonds n'est plus actif."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        serializer = SolidarityContributionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        contribution = serializer.save(fund=fund, contributor=request.user)
        push_notification(
            recipient=fund.creator,
            sender=request.user,
            notif_type=NotificationType.SOLIDARITY,
            title=f"Nouvelle contribution à votre fonds",
            body=f"{request.user.first_name} a contribué {contribution.amount} {fund.currency} à « {fund.title} »",
            link=f"/solidarity/{fund.pk}",
        )
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'], url_path='close')
    def close_fund(self, request, pk=None):
        fund = self.get_object()
        if fund.creator != request.user and not request.user.is_staff:
            return Response({'detail': 'Accès refusé.'}, status=status.HTTP_403_FORBIDDEN)
        fund.status = 'completed'
        fund.save(update_fields=['status'])
        return Response({'detail': 'Fonds clôturé.'})
