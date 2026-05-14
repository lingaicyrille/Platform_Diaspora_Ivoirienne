from django.conf import settings
from django.db import models


class GuideCategory(models.TextChoices):
    VISA = 'visa', 'Visa'
    RESIDENCE = 'residence', 'Titre de séjour'
    CITIZENSHIP = 'citizenship', 'Naturalisation'
    TRAVEL = 'travel', 'Voyage'
    WORK = 'work', 'Travail'
    STUDY = 'study', 'Études'


class Country(models.Model):
    name = models.CharField(max_length=100, unique=True)
    code = models.CharField(max_length=3, unique=True)
    flag_emoji = models.CharField(max_length=10, blank=True)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return self.name


class ImmigrationGuide(models.Model):
    country = models.ForeignKey(Country, on_delete=models.CASCADE, related_name='guides')
    title = models.CharField(max_length=200)
    content = models.TextField()
    category = models.CharField(
        max_length=15,
        choices=GuideCategory.choices,
        default=GuideCategory.VISA,
    )
    last_updated = models.DateTimeField(auto_now=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['country', 'category']

    def __str__(self):
        return f"{self.country} - {self.title}"


class ImmigrationQuestion(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='immigration_questions',
    )
    country = models.ForeignKey(Country, on_delete=models.CASCADE, related_name='questions')
    content = models.TextField()
    is_answered = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Question by {self.user} about {self.country}"


class ImmigrationAnswer(models.Model):
    question = models.ForeignKey(
        ImmigrationQuestion,
        on_delete=models.CASCADE,
        related_name='answers',
    )
    author = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='immigration_answers',
    )
    content = models.TextField()
    is_accepted = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f"Answer by {self.author}"
