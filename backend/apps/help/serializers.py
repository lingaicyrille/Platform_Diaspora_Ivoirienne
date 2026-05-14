from drf_spectacular.utils import extend_schema_field
from rest_framework import serializers
from .models import HelpRequest, HelpOffer


class UserBriefSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    first_name = serializers.CharField()
    last_name = serializers.CharField()


class HelpOfferSerializer(serializers.ModelSerializer):
    helper = serializers.SerializerMethodField()

    class Meta:
        model = HelpOffer
        fields = ['id', 'helper', 'message', 'created_at']
        read_only_fields = ['id', 'helper', 'created_at']

    @extend_schema_field(UserBriefSerializer)
    def get_helper(self, obj):
        return {
            'id': obj.helper.id,
            'first_name': obj.helper.first_name,
            'last_name': obj.helper.last_name,
        }


class HelpRequestSerializer(serializers.ModelSerializer):
    requester = serializers.SerializerMethodField()
    offers = HelpOfferSerializer(many=True, read_only=True)
    offer_count = serializers.SerializerMethodField()

    class Meta:
        model = HelpRequest
        fields = [
            'id', 'title', 'description', 'category', 'urgency',
            'status', 'requester', 'offers', 'offer_count',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'requester', 'created_at', 'updated_at']

    @extend_schema_field(UserBriefSerializer)
    def get_requester(self, obj):
        return {
            'id': obj.requester.id,
            'first_name': obj.requester.first_name,
            'last_name': obj.requester.last_name,
        }

    @extend_schema_field(serializers.IntegerField())
    def get_offer_count(self, obj):
        return obj.offers.count()
