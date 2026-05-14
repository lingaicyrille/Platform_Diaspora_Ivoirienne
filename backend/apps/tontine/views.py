from django.db import transaction
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.notifications.utils import push_notification
from apps.notifications.models import NotificationType
from .models import Tontine, TontineMembership, TontineRound, TontineContribution
from .serializers import (
    TontineSerializer,
    TontineDetailSerializer,
    TontineRoundSerializer,
    TontineContributionSerializer,
)


class TontineViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return (
            Tontine.objects
            .prefetch_related('members', 'rounds')
            .select_related('organizer')
        )

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return TontineDetailSerializer
        return TontineSerializer

    def perform_create(self, serializer):
        tontine = serializer.save(organizer=self.request.user)
        TontineMembership.objects.create(tontine=tontine, member=self.request.user, position=1)

    @action(detail=True, methods=['post'])
    def join(self, request, pk=None):
        tontine = self.get_object()
        if tontine.members.filter(pk=request.user.pk).exists():
            return Response(
                {'detail': 'Vous êtes déjà membre de cette tontine.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if tontine.members.count() >= tontine.max_members:
            return Response(
                {'detail': 'Cette tontine est complète.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if tontine.status not in ('pending', 'active'):
            return Response(
                {'detail': 'Impossible de rejoindre cette tontine.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        position = tontine.members.count() + 1
        TontineMembership.objects.create(
            tontine=tontine, member=request.user, position=position
        )
        push_notification(
            recipient=tontine.organizer,
            sender=request.user,
            notif_type=NotificationType.TONTINE,
            title=f"{request.user.first_name} a rejoint votre tontine",
            body=tontine.name,
            link=f"/tontines/{tontine.pk}",
        )
        return Response({'detail': 'Vous avez rejoint la tontine.'})

    @action(detail=True, methods=['post'])
    def leave(self, request, pk=None):
        tontine = self.get_object()
        if tontine.organizer == request.user:
            return Response(
                {'detail': "L'organisateur ne peut pas quitter la tontine."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        deleted, _ = TontineMembership.objects.filter(
            tontine=tontine, member=request.user
        ).delete()
        if not deleted:
            return Response(
                {'detail': "Vous n'êtes pas membre de cette tontine."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        return Response({'detail': 'Vous avez quitté la tontine.'})

    @action(detail=True, methods=['post'], url_path='contribute/(?P<round_pk>[0-9]+)')
    def contribute(self, request, pk=None, round_pk=None):
        tontine = self.get_object()
        if not tontine.members.filter(pk=request.user.pk).exists():
            return Response(
                {'detail': 'Vous devez être membre pour contribuer.'},
                status=status.HTTP_403_FORBIDDEN,
            )
        try:
            round_obj = tontine.rounds.get(pk=round_pk)
        except TontineRound.DoesNotExist:
            return Response({'detail': 'Tour introuvable.'}, status=status.HTTP_404_NOT_FOUND)

        if TontineContribution.objects.filter(round=round_obj, contributor=request.user).exists():
            return Response(
                {'detail': 'Vous avez déjà contribué à ce tour.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        serializer = TontineContributionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(round=round_obj, contributor=request.user)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class TontineRoundViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = TontineRoundSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = TontineRound.objects.select_related('beneficiary', 'tontine').prefetch_related('contributions')
        tontine_id = self.request.query_params.get('tontine')
        if tontine_id:
            qs = qs.filter(tontine__id=tontine_id)
        return qs
