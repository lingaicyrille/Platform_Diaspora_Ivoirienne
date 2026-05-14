from django.conf import settings
from django.core.validators import MinValueValidator
from django.db import models


class FundCategory(models.TextChoices):
    MEDICAL = 'medical', 'Médical'
    EDUCATION = 'education', 'Éducation'
    EMERGENCY = 'emergency', 'Urgence'
    REPATRIATION = 'repatriation', 'Rapatriement'
    FUNERAL = 'funeral', 'Obsèques'
    OTHER = 'other', 'Autre'


class FundStatus(models.TextChoices):
    ACTIVE = 'active', 'Active'
    COMPLETED = 'completed', 'Terminée'
    CANCELLED = 'cancelled', 'Annulée'


class SolidarityFund(models.Model):
    title = models.CharField(max_length=255)
    creator = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='created_funds',
    )
    description = models.TextField()
    target_amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        validators=[MinValueValidator(1)],
    )
    currency = models.CharField(max_length=5, default='EUR')
    deadline = models.DateField(null=True, blank=True)
    category = models.CharField(
        max_length=20,
        choices=FundCategory.choices,
        default=FundCategory.OTHER,
    )
    status = models.CharField(
        max_length=15,
        choices=FundStatus.choices,
        default=FundStatus.ACTIVE,
    )
    cover_image = models.ImageField(
        upload_to='solidarity/covers/',
        null=True,
        blank=True,
    )
    beneficiary_name = models.CharField(max_length=200, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.title

    @property
    def collected_amount(self):
        return sum(c.amount for c in self.contributions.filter(is_confirmed=True))

    @property
    def progress_pct(self):
        if self.target_amount and self.target_amount > 0:
            return min(100, int(self.collected_amount / self.target_amount * 100))
        return 0


class SolidarityContribution(models.Model):
    fund = models.ForeignKey(
        SolidarityFund,
        on_delete=models.CASCADE,
        related_name='contributions',
    )
    contributor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='solidarity_contributions',
    )
    amount = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(1)])
    message = models.CharField(max_length=500, blank=True)
    is_anonymous = models.BooleanField(default=False)
    is_confirmed = models.BooleanField(default=True)
    contributed_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-contributed_at']

    def __str__(self):
        return f"{self.contributor} → {self.fund} ({self.amount} {self.fund.currency})"
