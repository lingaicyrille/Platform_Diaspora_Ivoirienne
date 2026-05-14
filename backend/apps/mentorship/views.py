from django.db.models import Q
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.notifications.utils import push_notification
from apps.notifications.models import NotificationType
from .models import MentorProfile, MentorshipRequest, MentorshipSession
from .serializers import (
    MentorProfileSerializer,
    MentorshipRequestSerializer,
    MentorshipSessionSerializer,
)


class MentorProfileViewSet(viewsets.ModelViewSet):
    serializer_class = MentorProfileSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = MentorProfile.objects.select_related('mentor').prefetch_related('mentorship_requests')
        area = self.request.query_params.get('area')
        available_only = self.request.query_params.get('available')
        if area:
            qs = qs.filter(areas__contains=area)
        if available_only == 'true':
            qs = qs.filter(is_available=True)
        return qs

    def perform_create(self, serializer):
        serializer.save(mentor=self.request.user)

    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        if instance.mentor != request.user and not request.user.is_staff:
            return Response({'detail': 'Accès refusé.'}, status=status.HTTP_403_FORBIDDEN)
        return super().update(request, *args, **kwargs)


class MentorshipRequestViewSet(viewsets.ModelViewSet):
    serializer_class = MentorshipRequestSerializer
    permission_classes = [IsAuthenticated]
    http_method_names = ['get', 'post', 'delete', 'head', 'options']

    def get_queryset(self):
        if getattr(self, 'swagger_fake_view', False):
            return MentorshipRequest.objects.none()
        user = self.request.user
        return (
            MentorshipRequest.objects
            .filter(Q(mentee=user) | Q(mentor_profile__mentor=user))
            .select_related('mentee', 'mentor_profile__mentor')
            .prefetch_related('sessions')
            .distinct()
        )

    def perform_create(self, serializer):
        mentor_profile = serializer.validated_data['mentor_profile']
        if not mentor_profile.has_capacity:
            from rest_framework.exceptions import ValidationError
            raise ValidationError({'detail': 'Ce mentor n\'a plus de capacité disponible.'})
        if MentorshipRequest.objects.filter(mentee=self.request.user, mentor_profile=mentor_profile).exists():
            from rest_framework.exceptions import ValidationError
            raise ValidationError({'detail': 'Vous avez déjà une demande pour ce mentor.'})
        req = serializer.save(mentee=self.request.user)
        push_notification(
            recipient=mentor_profile.mentor,
            sender=self.request.user,
            notif_type=NotificationType.MENTORSHIP,
            title="Nouvelle demande de mentorat",
            body=f"{self.request.user.first_name} souhaite votre mentorat.",
            link=f"/mentorship/requests/{req.pk}",
        )

    @action(detail=True, methods=['post'])
    def accept(self, request, pk=None):
        req = self.get_object()
        if req.mentor_profile.mentor != request.user:
            return Response({'detail': 'Accès refusé.'}, status=status.HTTP_403_FORBIDDEN)
        if req.status != 'pending':
            return Response({'detail': 'Cette demande n\'est plus en attente.'}, status=status.HTTP_400_BAD_REQUEST)
        req.status = 'accepted'
        req.save(update_fields=['status'])
        push_notification(
            recipient=req.mentee,
            sender=request.user,
            notif_type=NotificationType.MENTORSHIP,
            title="Demande de mentorat acceptée !",
            body=f"{request.user.first_name} a accepté votre demande de mentorat.",
            link=f"/mentorship/requests/{req.pk}",
        )
        return Response({'detail': 'Demande acceptée.'})

    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        req = self.get_object()
        if req.mentor_profile.mentor != request.user:
            return Response({'detail': 'Accès refusé.'}, status=status.HTTP_403_FORBIDDEN)
        req.status = 'rejected'
        req.save(update_fields=['status'])
        push_notification(
            recipient=req.mentee,
            sender=request.user,
            notif_type=NotificationType.MENTORSHIP,
            title="Demande de mentorat",
            body=f"Votre demande de mentorat avec {request.user.first_name} n'a pas été acceptée.",
            link="/mentorship",
        )
        return Response({'detail': 'Demande refusée.'})

    @action(detail=True, methods=['post'], url_path='schedule')
    def schedule_session(self, request, pk=None):
        req = self.get_object()
        if req.mentor_profile.mentor != request.user and req.mentee != request.user:
            return Response({'detail': 'Accès refusé.'}, status=status.HTTP_403_FORBIDDEN)
        if req.status != 'accepted':
            return Response(
                {'detail': 'La demande doit être acceptée pour planifier une session.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        serializer = MentorshipSessionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        session = serializer.save(request=req)
        other = req.mentee if request.user == req.mentor_profile.mentor else req.mentor_profile.mentor
        push_notification(
            recipient=other,
            sender=request.user,
            notif_type=NotificationType.MENTORSHIP,
            title="Session de mentorat planifiée",
            body=f"Une session a été planifiée pour le {session.scheduled_at.strftime('%d/%m/%Y à %H:%M')}.",
            link=f"/mentorship/requests/{req.pk}",
        )
        return Response(serializer.data, status=status.HTTP_201_CREATED)
