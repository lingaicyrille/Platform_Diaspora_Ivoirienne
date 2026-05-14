from rest_framework import serializers

from .models import MentorProfile, MentorshipRequest, MentorshipSession


class UserMinimalSerializer(serializers.Serializer):
    id = serializers.IntegerField(read_only=True)
    first_name = serializers.CharField(read_only=True)
    last_name = serializers.CharField(read_only=True)
    country_of_residence = serializers.CharField(read_only=True)


class MentorProfileSerializer(serializers.ModelSerializer):
    mentor = UserMinimalSerializer(read_only=True)
    active_mentee_count = serializers.IntegerField(read_only=True)
    has_capacity = serializers.BooleanField(read_only=True)

    class Meta:
        model = MentorProfile
        fields = [
            'id', 'mentor', 'bio', 'areas', 'languages',
            'country_of_expertise', 'years_in_diaspora',
            'max_mentees', 'is_available', 'active_mentee_count',
            'has_capacity', 'created_at',
        ]
        read_only_fields = ['mentor', 'created_at']


class MentorshipSessionSerializer(serializers.ModelSerializer):
    class Meta:
        model = MentorshipSession
        fields = [
            'id', 'scheduled_at', 'duration_minutes', 'location',
            'is_online', 'meeting_link', 'notes', 'completed', 'created_at',
        ]
        read_only_fields = ['created_at']


class MentorshipRequestSerializer(serializers.ModelSerializer):
    mentee = UserMinimalSerializer(read_only=True)
    mentor_profile = MentorProfileSerializer(read_only=True)
    mentor_profile_id = serializers.PrimaryKeyRelatedField(
        queryset=MentorProfile.objects.all(),
        write_only=True,
        source='mentor_profile',
    )
    sessions = MentorshipSessionSerializer(many=True, read_only=True)

    class Meta:
        model = MentorshipRequest
        fields = [
            'id', 'mentee', 'mentor_profile', 'mentor_profile_id',
            'areas_requested', 'message', 'status', 'sessions', 'created_at',
        ]
        read_only_fields = ['mentee', 'status', 'created_at']
