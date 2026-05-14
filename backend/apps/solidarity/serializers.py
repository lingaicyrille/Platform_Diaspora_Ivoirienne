from drf_spectacular.utils import extend_schema_field
from rest_framework import serializers
from .models import SolidarityFund, SolidarityContribution


class CreatorMinimalSerializer(serializers.Serializer):
    id = serializers.IntegerField(read_only=True)
    first_name = serializers.CharField(read_only=True)
    last_name = serializers.CharField(read_only=True)


class SolidarityContributionSerializer(serializers.ModelSerializer):
    contributor = serializers.SerializerMethodField()

    class Meta:
        model = SolidarityContribution
        fields = [
            'id', 'contributor', 'amount', 'message',
            'is_anonymous', 'is_confirmed', 'contributed_at',
        ]
        read_only_fields = ['contributor', 'is_confirmed', 'contributed_at']

    @extend_schema_field(CreatorMinimalSerializer(allow_null=True))
    def get_contributor(self, obj):
        if obj.is_anonymous:
            return {'id': None, 'first_name': 'Anonyme', 'last_name': ''}
        return CreatorMinimalSerializer(obj.contributor).data


class SolidarityFundSerializer(serializers.ModelSerializer):
    creator = CreatorMinimalSerializer(read_only=True)
    collected_amount = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    progress_pct = serializers.IntegerField(read_only=True)
    contributor_count = serializers.SerializerMethodField()

    class Meta:
        model = SolidarityFund
        fields = [
            'id', 'title', 'creator', 'description', 'target_amount',
            'collected_amount', 'progress_pct', 'currency', 'deadline',
            'category', 'status', 'cover_image', 'beneficiary_name',
            'contributor_count', 'created_at',
        ]
        read_only_fields = ['creator', 'status', 'created_at']

    @extend_schema_field(serializers.IntegerField())
    def get_contributor_count(self, obj):
        return obj.contributions.filter(is_confirmed=True).count()


class SolidarityFundDetailSerializer(SolidarityFundSerializer):
    contributions = SolidarityContributionSerializer(many=True, read_only=True)

    class Meta(SolidarityFundSerializer.Meta):
        fields = SolidarityFundSerializer.Meta.fields + ['contributions']
