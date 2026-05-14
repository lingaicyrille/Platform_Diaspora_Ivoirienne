from django.conf import settings
from django.db import models


class MentorshipArea(models.TextChoices):
    CAREER = 'career', 'Carrière'
    BUSINESS = 'business', 'Entrepreneuriat'
    EDUCATION = 'education', 'Éducation'
    IMMIGRATION = 'immigration', 'Immigration'
    INTEGRATION = 'integration', 'Intégration'
    FINANCE = 'finance', 'Finance'
    HEALTH = 'health', 'Santé'
    OTHER = 'other', 'Autre'


class RequestStatus(models.TextChoices):
    PENDING = 'pending', 'En attente'
    ACCEPTED = 'accepted', 'Acceptée'
    REJECTED = 'rejected', 'Refusée'
    COMPLETED = 'completed', 'Terminée'


class MentorProfile(models.Model):
    mentor = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='mentor_profile',
    )
    bio = models.TextField(blank=True)
    areas = models.JSONField(default=list)
    languages = models.JSONField(default=list)
    country_of_expertise = models.CharField(max_length=100, blank=True)
    years_in_diaspora = models.PositiveIntegerField(null=True, blank=True)
    max_mentees = models.PositiveIntegerField(default=3)
    is_available = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Mentor: {self.mentor}"

    @property
    def active_mentee_count(self):
        return self.mentorship_requests.filter(status='accepted').count()

    @property
    def has_capacity(self):
        return self.active_mentee_count < self.max_mentees


class MentorshipRequest(models.Model):
    mentee = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='mentorship_requests_sent',
    )
    mentor_profile = models.ForeignKey(
        MentorProfile,
        on_delete=models.CASCADE,
        related_name='mentorship_requests',
    )
    areas_requested = models.JSONField(default=list)
    message = models.TextField()
    status = models.CharField(
        max_length=15,
        choices=RequestStatus.choices,
        default=RequestStatus.PENDING,
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        unique_together = [('mentee', 'mentor_profile')]

    def __str__(self):
        return f"{self.mentee} → {self.mentor_profile.mentor} [{self.status}]"


class MentorshipSession(models.Model):
    request = models.ForeignKey(
        MentorshipRequest,
        on_delete=models.CASCADE,
        related_name='sessions',
    )
    scheduled_at = models.DateTimeField()
    duration_minutes = models.PositiveIntegerField(default=60)
    location = models.CharField(max_length=300, blank=True)
    is_online = models.BooleanField(default=True)
    meeting_link = models.URLField(blank=True)
    notes = models.TextField(blank=True)
    completed = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['scheduled_at']

    def __str__(self):
        return f"Session {self.scheduled_at} — {self.request}"
