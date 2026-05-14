from django.conf import settings
from django.db import models
from cloudinary.models import CloudinaryField


class AssociationCategory(models.TextChoices):
    CULTURAL = 'cultural', 'Culturelle'
    HUMANITARIAN = 'humanitarian', 'Humanitaire'
    EDUCATIONAL = 'educational', 'Éducative'
    PROFESSIONAL = 'professional', 'Professionnelle'
    SPORTS = 'sports', 'Sportive'
    RELIGIOUS = 'religious', 'Religieuse'
    OTHER = 'other', 'Autre'


class MemberRole(models.TextChoices):
    MEMBER = 'member', 'Membre'
    BOARD = 'board', 'Bureau'
    PRESIDENT = 'president', 'Président'


class Association(models.Model):
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    category = models.CharField(
        max_length=20,
        choices=AssociationCategory.choices,
        default=AssociationCategory.OTHER,
    )
    country = models.CharField(max_length=100, blank=True)
    city = models.CharField(max_length=100, blank=True)
    logo = CloudinaryField('association_logo', blank=True, null=True, folder='associations')
    website = models.URLField(blank=True)
    contact_email = models.EmailField(blank=True)
    is_verified = models.BooleanField(default=False)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='created_associations',
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.name


class AssociationMember(models.Model):
    association = models.ForeignKey(
        Association,
        on_delete=models.CASCADE,
        related_name='members',
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='association_memberships',
    )
    role = models.CharField(
        max_length=15,
        choices=MemberRole.choices,
        default=MemberRole.MEMBER,
    )
    joined_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('association', 'user')

    def __str__(self):
        return f"{self.user} in {self.association}"
