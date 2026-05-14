from drf_spectacular.utils import extend_schema_field
from rest_framework import serializers
from .models import Ad


class AdvertiserSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    first_name = serializers.CharField()
    last_name = serializers.CharField()


class AdSerializer(serializers.ModelSerializer):
    advertiser = serializers.SerializerMethodField()

    class Meta:
        model = Ad
        fields = [
            'id', 'title', 'body', 'image', 'link', 'placement',
            'start_date', 'end_date', 'is_active',
            'impressions', 'clicks', 'advertiser', 'created_at',
        ]
        read_only_fields = ['id', 'impressions', 'clicks', 'advertiser', 'created_at']

    @extend_schema_field(AdvertiserSerializer)
    def get_advertiser(self, obj):
        return {
            'id': obj.advertiser.id,
            'first_name': obj.advertiser.first_name,
            'last_name': obj.advertiser.last_name,
        }
