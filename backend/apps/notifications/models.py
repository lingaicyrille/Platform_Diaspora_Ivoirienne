from django.conf import settings
from django.db import models


class NotificationType(models.TextChoices):
    MESSAGE = 'message', 'Message'
    GROUP_JOIN = 'group_join', 'Rejoindre groupe'
    EVENT_RSVP = 'event_rsvp', 'RSVP événement'
    TONTINE = 'tontine', 'Tontine'
    SOLIDARITY = 'solidarity', 'Solidarité'
    MENTORSHIP = 'mentorship', 'Mentorat'
    MARKETPLACE = 'marketplace', 'Marketplace'
    OFFER = 'offer', 'Offre'
    GENERAL = 'general', 'Général'


class Notification(models.Model):
    recipient = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='notifications',
    )
    sender = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='sent_notifications',
    )
    type = models.CharField(
        max_length=30,
        choices=NotificationType.choices,
        default=NotificationType.GENERAL,
    )
    title = models.CharField(max_length=200)
    body = models.TextField(blank=True)
    link = models.CharField(max_length=300, blank=True)
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['recipient', 'is_read']),
        ]

    def __str__(self):
        return f"[{self.type}] {self.title} → {self.recipient}"
