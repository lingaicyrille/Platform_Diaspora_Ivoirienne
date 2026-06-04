from datetime import timedelta

from django.conf import settings
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from django.utils import timezone
from drf_spectacular.utils import extend_schema, inline_serializer
from rest_framework import generics, permissions, serializers as drf_serializers, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView

from .models import EmailVerificationToken, PasswordResetToken, User
from .serializers import (
    CustomTokenObtainPairSerializer, RegisterSerializer, UserSerializer,
)

TOKEN_EXPIRY_HOURS = 24


def _send_verification_email(user, token_obj):
    from .tasks import send_verification_email_task
    send_verification_email_task.delay(user.email, user.first_name, str(token_obj.token))


def _send_password_reset_email(user, token_obj):
    from .tasks import send_password_reset_email_task
    send_password_reset_email_task.delay(user.email, user.first_name, str(token_obj.token))


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = [permissions.AllowAny]
    serializer_class = RegisterSerializer

    def perform_create(self, serializer):
        user = serializer.save()
        token = EmailVerificationToken.objects.create(user=user)
        _send_verification_email(user, token)


class LoginView(TokenObtainPairView):
    permission_classes = [permissions.AllowAny]
    serializer_class = CustomTokenObtainPairSerializer


class ProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user


class UserListView(generics.ListAPIView):
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    ALLOWED_ORDERING = {'trust_score', '-trust_score', 'date_joined', '-date_joined'}

    def get_queryset(self):
        qs = User.objects.filter(is_active=True)
        continent = self.request.query_params.get('continent')
        country = self.request.query_params.get('country')
        search = self.request.query_params.get('search')
        ordering = self.request.query_params.get('ordering')
        if continent:
            qs = qs.filter(continent=continent)
        if country:
            qs = qs.filter(country_of_residence__icontains=country)
        if search:
            from django.db.models import Q
            qs = qs.filter(
                Q(first_name__icontains=search) |
                Q(last_name__icontains=search) |
                Q(email__icontains=search)
            )
        if ordering and ordering in self.ALLOWED_ORDERING:
            qs = qs.order_by(ordering)
        return qs


_detail_schema = inline_serializer(name='DetailResponse', fields={'detail': drf_serializers.CharField()})
_stats_schema = inline_serializer(name='DashboardStats', fields={
    'members': drf_serializers.IntegerField(),
    'upcoming_events': drf_serializers.IntegerField(),
    'active_businesses': drf_serializers.IntegerField(),
    'unread_notifications': drf_serializers.IntegerField(),
})


@extend_schema(responses=_stats_schema)
class DashboardStatsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        from django.apps import apps
        from apps.notifications.models import Notification

        member_count = User.objects.filter(is_active=True).count()

        Event = apps.get_model('events', 'Event')
        upcoming_events = Event.objects.filter(start_datetime__gte=timezone.now()).count()

        Business = apps.get_model('business', 'Business')
        active_businesses = Business.objects.filter(is_active=True).count()

        unread_notifications = Notification.objects.filter(
            recipient=request.user, is_read=False
        ).count()

        return Response({
            'members': member_count,
            'upcoming_events': upcoming_events,
            'active_businesses': active_businesses,
            'unread_notifications': unread_notifications,
        })


@extend_schema(responses=_detail_schema)
class VerifyEmailView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        token_str = request.query_params.get('token')
        if not token_str:
            return Response({'detail': 'Token manquant.'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            token = EmailVerificationToken.objects.select_related('user').get(token=token_str)
        except (EmailVerificationToken.DoesNotExist, ValueError):
            return Response({'detail': 'Token invalide.'}, status=status.HTTP_400_BAD_REQUEST)

        if token.is_used:
            return Response({'detail': 'Ce lien a déjà été utilisé.'}, status=status.HTTP_400_BAD_REQUEST)
        if token.created_at < timezone.now() - timedelta(hours=TOKEN_EXPIRY_HOURS):
            return Response({'detail': 'Ce lien a expiré.'}, status=status.HTTP_400_BAD_REQUEST)

        token.is_used = True
        token.save(update_fields=['is_used'])
        token.user.is_verified = True
        token.user.save(update_fields=['is_verified'])
        return Response({'detail': 'Email vérifié avec succès.'})


@extend_schema(request=None, responses=_detail_schema)
class ResendVerificationView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        user = request.user
        if user.is_verified:
            return Response({'detail': 'Votre email est déjà vérifié.'})
        token = EmailVerificationToken.objects.create(user=user)
        _send_verification_email(user, token)
        return Response({'detail': 'Email de vérification envoyé.'})


@extend_schema(
    request=inline_serializer(name='PasswordResetRequest', fields={'email': drf_serializers.EmailField()}),
    responses=_detail_schema,
)
class PasswordResetRequestView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        email = request.data.get('email', '').strip().lower()
        try:
            user = User.objects.get(email=email, is_active=True)
            token = PasswordResetToken.objects.create(user=user)
            _send_password_reset_email(user, token)
        except User.DoesNotExist:
            pass  # Silently succeed to prevent user enumeration
        return Response({'detail': 'Si cet email existe, un lien de réinitialisation a été envoyé.'})


@extend_schema(
    request=inline_serializer(name='PasswordResetConfirm', fields={
        'token': drf_serializers.UUIDField(),
        'new_password': drf_serializers.CharField(),
    }),
    responses=_detail_schema,
)
class PasswordResetConfirmView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        token_str = request.data.get('token', '')
        new_password = request.data.get('new_password', '')

        if not token_str or not new_password:
            return Response(
                {'detail': 'Token et nouveau mot de passe requis.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        try:
            token = PasswordResetToken.objects.select_related('user').get(token=token_str)
        except (PasswordResetToken.DoesNotExist, ValueError):
            return Response({'detail': 'Token invalide.'}, status=status.HTTP_400_BAD_REQUEST)

        if token.is_used:
            return Response({'detail': 'Ce lien a déjà été utilisé.'}, status=status.HTTP_400_BAD_REQUEST)
        if token.created_at < timezone.now() - timedelta(hours=TOKEN_EXPIRY_HOURS):
            return Response({'detail': 'Ce lien a expiré.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            validate_password(new_password, token.user)
        except DjangoValidationError as e:
            return Response({'detail': list(e.messages)}, status=status.HTTP_400_BAD_REQUEST)

        token.user.set_password(new_password)
        token.user.save(update_fields=['password'])
        token.is_used = True
        token.save(update_fields=['is_used'])
        # Invalidate all other reset tokens for this user
        PasswordResetToken.objects.filter(user=token.user, is_used=False).update(is_used=True)
        return Response({'detail': 'Mot de passe réinitialisé avec succès.'})
