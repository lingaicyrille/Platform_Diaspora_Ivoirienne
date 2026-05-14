from django.conf import settings
from django.db import models
from cloudinary.models import CloudinaryField


class EventCategory(models.TextChoices):
    CULTURAL = 'cultural', 'Culturel'
    SPORTS = 'sports', 'Sports'
    BUSINESS = 'business', 'Business'
    COMMUNITY = 'community', 'Communauté'
    EDUCATION = 'education', 'Éducation'
    OTHER = 'other', 'Autre'


class RSVPStatus(models.TextChoices):
    GOING = 'going', "J'y vais"
    MAYBE = 'maybe', 'Peut-être'
    NOT_GOING = 'not_going', "Je n'y vais pas"


class Event(models.Model):
    title = models.CharField(max_length=200)
    description = models.TextField()
    organizer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='organized_events',
    )
    address = models.CharField(max_length=255, blank=True)
    city = models.CharField(max_length=100, blank=True)
    country = models.CharField(max_length=100, blank=True)
    latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    start_datetime = models.DateTimeField()
    end_datetime = models.DateTimeField()
    cover_image = CloudinaryField('event_cover', blank=True, null=True, folder='events')
    is_online = models.BooleanField(default=False)
    online_link = models.URLField(blank=True)
    capacity = models.PositiveIntegerField(null=True, blank=True)
    category = models.CharField(
        max_length=20,
        choices=EventCategory.choices,
        default=EventCategory.OTHER,
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['start_datetime']

    def __str__(self):
        return self.title


class RSVP(models.Model):
    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name='rsvps')
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='rsvps',
    )
    status = models.CharField(max_length=15, choices=RSVPStatus.choices, default=RSVPStatus.GOING)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('event', 'user')

    def __str__(self):
        return f"{self.user} is {self.status} to {self.event}"
