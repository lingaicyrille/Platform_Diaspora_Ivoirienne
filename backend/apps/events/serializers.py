from drf_spectacular.utils import extend_schema_field
from rest_framework import serializers
from .models import Event, RSVP, RSVPStatus


class OrganizerSerializer(serializers.Serializer):
    id = serializers.IntegerField(read_only=True)
    first_name = serializers.CharField(read_only=True)
    last_name = serializers.CharField(read_only=True)


class EventSerializer(serializers.ModelSerializer):
    organizer = OrganizerSerializer(read_only=True)
    attendee_count = serializers.SerializerMethodField()
    user_rsvp_status = serializers.SerializerMethodField()

    class Meta:
        model = Event
        fields = [
            'id', 'title', 'description', 'organizer',
            'address', 'city', 'country', 'latitude', 'longitude',
            'start_datetime', 'end_datetime', 'cover_image',
            'is_online', 'online_link', 'capacity', 'category',
            'attendee_count', 'user_rsvp_status',
            'created_at', 'updated_at',
        ]

    @extend_schema_field(serializers.IntegerField())
    def get_attendee_count(self, obj):
        return obj.rsvps.filter(status=RSVPStatus.GOING).count()

    @extend_schema_field(serializers.CharField(allow_null=True))
    def get_user_rsvp_status(self, obj):
        request = self.context.get('request')
        if request and request.user and request.user.is_authenticated:
            rsvp = obj.rsvps.filter(user=request.user).first()
            if rsvp:
                return rsvp.status
        return None


class RSVPSerializer(serializers.ModelSerializer):
    user = serializers.PrimaryKeyRelatedField(read_only=True)
    event = serializers.PrimaryKeyRelatedField(read_only=True)

    class Meta:
        model = RSVP
        fields = ['id', 'event', 'user', 'status', 'created_at']
