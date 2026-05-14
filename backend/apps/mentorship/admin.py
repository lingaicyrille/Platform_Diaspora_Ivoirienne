from django.contrib import admin

from .models import MentorProfile, MentorshipRequest, MentorshipSession


@admin.register(MentorProfile)
class MentorProfileAdmin(admin.ModelAdmin):
    list_display = ['mentor', 'areas', 'max_mentees', 'is_available', 'created_at']
    list_filter = ['is_available']


@admin.register(MentorshipRequest)
class MentorshipRequestAdmin(admin.ModelAdmin):
    list_display = ['mentee', 'mentor_profile', 'status', 'created_at']
    list_filter = ['status']


@admin.register(MentorshipSession)
class MentorshipSessionAdmin(admin.ModelAdmin):
    list_display = ['request', 'scheduled_at', 'duration_minutes', 'is_online', 'completed']
