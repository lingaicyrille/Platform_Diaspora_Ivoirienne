from django.conf import settings
from django.db import models
from cloudinary.models import CloudinaryField


class BusinessCategory(models.TextChoices):
    RESTAURANT = 'restaurant', 'Restaurant'
    RETAIL = 'retail', 'Commerce'
    SERVICES = 'services', 'Services'
    TECH = 'tech', 'Technologie'
    HEALTH = 'health', 'Santé'
    EDUCATION = 'education', 'Éducation'
    REAL_ESTATE = 'real_estate', 'Immobilier'
    OTHER = 'other', 'Autre'


class Business(models.Model):
    name = models.CharField(max_length=200)
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='businesses',
    )
    description = models.TextField(blank=True)
    category = models.CharField(
        max_length=20,
        choices=BusinessCategory.choices,
        default=BusinessCategory.OTHER,
    )
    address = models.CharField(max_length=255, blank=True)
    country = models.CharField(max_length=100, blank=True)
    city = models.CharField(max_length=100, blank=True)
    phone = models.CharField(max_length=30, blank=True)
    website = models.URLField(blank=True)
    email = models.EmailField(blank=True)
    logo = CloudinaryField('business_logo', blank=True, null=True, folder='businesses')
    is_verified = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.name


class Review(models.Model):
    business = models.ForeignKey(Business, on_delete=models.CASCADE, related_name='reviews')
    author = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='business_reviews',
    )
    rating = models.PositiveSmallIntegerField()  # 1-5
    comment = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('business', 'author')
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.author} rated {self.business} {self.rating}/5"
