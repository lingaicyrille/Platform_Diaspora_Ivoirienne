from django.conf import settings
from django.db import models
from cloudinary.models import CloudinaryField


class ArticleCategory(models.TextChoices):
    POLITICS = 'politics', 'Politique'
    ECONOMY = 'economy', 'Économie'
    CULTURE = 'culture', 'Culture'
    SPORTS = 'sports', 'Sports'
    DIASPORA = 'diaspora', 'Diaspora'
    TECH = 'tech', 'Technologie'
    HEALTH = 'health', 'Santé'
    OTHER = 'other', 'Autre'


class Tag(models.Model):
    name = models.CharField(max_length=50, unique=True)

    def __str__(self):
        return self.name


class Article(models.Model):
    author = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='articles',
    )
    title = models.CharField(max_length=255)
    content = models.TextField()
    category = models.CharField(
        max_length=20,
        choices=ArticleCategory.choices,
        default=ArticleCategory.OTHER,
    )
    cover_image = CloudinaryField('article_cover', blank=True, null=True, folder='news')
    tags = models.ManyToManyField(Tag, blank=True, related_name='articles')
    is_published = models.BooleanField(default=False)
    published_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-published_at', '-created_at']

    def __str__(self):
        return self.title
