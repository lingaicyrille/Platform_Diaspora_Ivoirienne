from django.conf import settings
from django.db import models
from cloudinary.models import CloudinaryField


class Placement(models.TextChoices):
    BANNER = 'banner', 'Bannière'
    SIDEBAR = 'sidebar', 'Sidebar'
    FEED = 'feed', 'Fil d\'actualité'


class Ad(models.Model):
    advertiser = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='ads',
    )
    title = models.CharField(max_length=150)
    body = models.TextField(blank=True)
    image = CloudinaryField('ad_image', blank=True, null=True, folder='ads')
    link = models.URLField()
    placement = models.CharField(
        max_length=10,
        choices=Placement.choices,
        default=Placement.FEED,
    )
    start_date = models.DateField()
    end_date = models.DateField()
    is_active = models.BooleanField(default=True)
    impressions = models.PositiveIntegerField(default=0)
    clicks = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.title
