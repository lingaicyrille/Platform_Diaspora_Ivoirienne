from celery import shared_task
from django.conf import settings
from django.core.mail import send_mail


@shared_task(bind=True, max_retries=3, default_retry_delay=60)
def send_verification_email_task(self, user_email: str, user_first_name: str, token_str: str):
    link = f"{settings.FRONTEND_URL}/auth/verify-email?token={token_str}"
    try:
        send_mail(
            subject="Vérifiez votre adresse email — Diaspora Ivoirienne",
            message=(
                f"Bonjour {user_first_name},\n\n"
                f"Cliquez sur le lien ci-dessous pour vérifier votre adresse email :\n{link}\n\n"
                "Ce lien expire dans 24 heures.\n\n"
                "L'équipe Diaspora Ivoirienne"
            ),
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user_email],
        )
    except Exception as exc:
        raise self.retry(exc=exc)


@shared_task(bind=True, max_retries=3, default_retry_delay=60)
def send_password_reset_email_task(self, user_email: str, user_first_name: str, token_str: str):
    link = f"{settings.FRONTEND_URL}/auth/reset-password?token={token_str}"
    try:
        send_mail(
            subject="Réinitialisation de mot de passe — Diaspora Ivoirienne",
            message=(
                f"Bonjour {user_first_name},\n\n"
                f"Cliquez sur le lien ci-dessous pour réinitialiser votre mot de passe :\n{link}\n\n"
                "Ce lien expire dans 24 heures. Si vous n'avez pas fait cette demande, ignorez cet email.\n\n"
                "L'équipe Diaspora Ivoirienne"
            ),
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user_email],
        )
    except Exception as exc:
        raise self.retry(exc=exc)
