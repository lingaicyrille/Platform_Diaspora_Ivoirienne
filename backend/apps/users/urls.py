from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    DashboardStatsView, LoginView, PasswordResetConfirmView,
    PasswordResetRequestView, ProfileView, RegisterView,
    ResendVerificationView, UserListView, VerifyEmailView,
)

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', LoginView.as_view(), name='login'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token-refresh'),
    path('me/', ProfileView.as_view(), name='profile'),
    path('stats/', DashboardStatsView.as_view(), name='dashboard-stats'),
    path('verify-email/', VerifyEmailView.as_view(), name='verify-email'),
    path('resend-verification/', ResendVerificationView.as_view(), name='resend-verification'),
    path('password-reset/', PasswordResetRequestView.as_view(), name='password-reset'),
    path('password-reset/confirm/', PasswordResetConfirmView.as_view(), name='password-reset-confirm'),
    path('', UserListView.as_view(), name='user-list'),
]
