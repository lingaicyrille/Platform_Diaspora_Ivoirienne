from django.conf import settings
from django.db import models


class TontineFrequency(models.TextChoices):
    WEEKLY = 'weekly', 'Hebdomadaire'
    BIWEEKLY = 'biweekly', 'Bimensuel'
    MONTHLY = 'monthly', 'Mensuel'


class TontineStatus(models.TextChoices):
    PENDING = 'pending', 'En attente'
    ACTIVE = 'active', 'Active'
    COMPLETED = 'completed', 'Terminée'
    PAUSED = 'paused', 'En pause'


class RoundStatus(models.TextChoices):
    PENDING = 'pending', 'En attente'
    ACTIVE = 'active', 'Active'
    COMPLETED = 'completed', 'Terminée'


class Tontine(models.Model):
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    organizer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='organized_tontines',
    )
    members = models.ManyToManyField(
        settings.AUTH_USER_MODEL,
        related_name='tontines',
        blank=True,
        through='TontineMembership',
    )
    contribution_amount = models.DecimalField(max_digits=10, decimal_places=2)
    currency = models.CharField(max_length=5, default='EUR')
    frequency = models.CharField(
        max_length=10,
        choices=TontineFrequency.choices,
        default=TontineFrequency.MONTHLY,
    )
    start_date = models.DateField()
    max_members = models.PositiveIntegerField(default=12)
    status = models.CharField(
        max_length=10,
        choices=TontineStatus.choices,
        default=TontineStatus.PENDING,
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.name


class TontineMembership(models.Model):
    tontine = models.ForeignKey(Tontine, on_delete=models.CASCADE)
    member = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    joined_at = models.DateTimeField(auto_now_add=True)
    position = models.PositiveIntegerField(null=True, blank=True)

    class Meta:
        unique_together = [('tontine', 'member')]
        ordering = ['position', 'joined_at']


class TontineRound(models.Model):
    tontine = models.ForeignKey(
        Tontine,
        on_delete=models.CASCADE,
        related_name='rounds',
    )
    round_number = models.PositiveIntegerField()
    beneficiary = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='tontine_rounds_received',
    )
    start_date = models.DateField()
    end_date = models.DateField()
    status = models.CharField(
        max_length=10,
        choices=RoundStatus.choices,
        default=RoundStatus.PENDING,
    )

    class Meta:
        ordering = ['round_number']
        unique_together = [('tontine', 'round_number')]

    def __str__(self):
        return f"{self.tontine.name} — Tour {self.round_number}"


class TontineContribution(models.Model):
    round = models.ForeignKey(
        TontineRound,
        on_delete=models.CASCADE,
        related_name='contributions',
    )
    contributor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='tontine_contributions',
    )
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    paid_at = models.DateTimeField(auto_now_add=True)
    proof_of_payment = models.ImageField(
        upload_to='tontine/proofs/',
        null=True,
        blank=True,
    )
    note = models.CharField(max_length=255, blank=True)

    class Meta:
        unique_together = [('round', 'contributor')]
        ordering = ['-paid_at']

    def __str__(self):
        return f"{self.contributor} → {self.round}"
