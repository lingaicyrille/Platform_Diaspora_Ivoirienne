from django.conf import settings
from django.db import models
from cloudinary.models import CloudinaryField


class ListingCategory(models.TextChoices):
    ELECTRONICS = 'electronics', 'Électronique'
    CLOTHING = 'clothing', 'Vêtements'
    FURNITURE = 'furniture', 'Mobilier'
    VEHICLES = 'vehicles', 'Véhicules'
    FOOD = 'food', 'Alimentation'
    SERVICES = 'services', 'Services'
    OTHER = 'other', 'Autre'


class Condition(models.TextChoices):
    NEW = 'new', 'Neuf'
    USED = 'used', 'Occasion'


class OfferStatus(models.TextChoices):
    PENDING = 'pending', 'En attente'
    ACCEPTED = 'accepted', 'Acceptée'
    REJECTED = 'rejected', 'Refusée'


class Listing(models.Model):
    title = models.CharField(max_length=200)
    seller = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='listings',
    )
    description = models.TextField()
    price = models.DecimalField(max_digits=12, decimal_places=2)
    currency = models.CharField(max_length=3, default='EUR')
    category = models.CharField(
        max_length=20,
        choices=ListingCategory.choices,
        default=ListingCategory.OTHER,
    )
    condition = models.CharField(
        max_length=10,
        choices=Condition.choices,
        default=Condition.USED,
    )
    image = CloudinaryField('listing_image', blank=True, null=True, folder='marketplace')
    location = models.CharField(max_length=200, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.title


class Offer(models.Model):
    listing = models.ForeignKey(Listing, on_delete=models.CASCADE, related_name='offers')
    buyer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='offers',
    )
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    message = models.TextField(blank=True)
    status = models.CharField(
        max_length=10,
        choices=OfferStatus.choices,
        default=OfferStatus.PENDING,
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Offer by {self.buyer} on {self.listing}"
