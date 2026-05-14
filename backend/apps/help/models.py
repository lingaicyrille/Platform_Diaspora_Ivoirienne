from django.conf import settings
from django.db import models


class HelpCategory(models.TextChoices):
    HOUSING = 'housing', 'Logement'
    EMPLOYMENT = 'employment', 'Emploi'
    LEGAL = 'legal', 'Juridique'
    MEDICAL = 'medical', 'Médical'
    EDUCATION = 'education', 'Éducation'
    FINANCIAL = 'financial', 'Financier'
    OTHER = 'other', 'Autre'


class Urgency(models.TextChoices):
    LOW = 'low', 'Faible'
    MEDIUM = 'medium', 'Moyen'
    HIGH = 'high', 'Urgent'


class RequestStatus(models.TextChoices):
    OPEN = 'open', 'Ouvert'
    IN_PROGRESS = 'in_progress', 'En cours'
    RESOLVED = 'resolved', 'Résolu'


class HelpRequest(models.Model):
    requester = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='help_requests',
    )
    title = models.CharField(max_length=200)
    description = models.TextField()
    category = models.CharField(
        max_length=20,
        choices=HelpCategory.choices,
        default=HelpCategory.OTHER,
    )
    urgency = models.CharField(
        max_length=10,
        choices=Urgency.choices,
        default=Urgency.MEDIUM,
    )
    status = models.CharField(
        max_length=15,
        choices=RequestStatus.choices,
        default=RequestStatus.OPEN,
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.title


class HelpOffer(models.Model):
    request = models.ForeignKey(
        HelpRequest,
        on_delete=models.CASCADE,
        related_name='offers',
    )
    helper = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='help_offers',
    )
    message = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        unique_together = [('request', 'helper')]

    def __str__(self):
        return f"{self.helper} → {self.request}"
