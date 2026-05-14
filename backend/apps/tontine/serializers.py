from drf_spectacular.utils import extend_schema_field
from rest_framework import serializers
from .models import Tontine, TontineMembership, TontineRound, TontineContribution


class MemberMinimalSerializer(serializers.Serializer):
    id = serializers.IntegerField(read_only=True)
    first_name = serializers.CharField(read_only=True)
    last_name = serializers.CharField(read_only=True)


class TontineMembershipSerializer(serializers.ModelSerializer):
    member = MemberMinimalSerializer(read_only=True)

    class Meta:
        model = TontineMembership
        fields = ['id', 'member', 'joined_at', 'position']


class TontineContributionSerializer(serializers.ModelSerializer):
    contributor = MemberMinimalSerializer(read_only=True)

    class Meta:
        model = TontineContribution
        fields = ['id', 'contributor', 'amount', 'paid_at', 'proof_of_payment', 'note']
        read_only_fields = ['contributor', 'paid_at']


class TontineRoundSerializer(serializers.ModelSerializer):
    beneficiary = MemberMinimalSerializer(read_only=True)
    contributions = TontineContributionSerializer(many=True, read_only=True)
    collected_amount = serializers.SerializerMethodField()

    class Meta:
        model = TontineRound
        fields = [
            'id', 'round_number', 'beneficiary', 'start_date',
            'end_date', 'status', 'contributions', 'collected_amount',
        ]

    @extend_schema_field(serializers.DecimalField(max_digits=12, decimal_places=2))
    def get_collected_amount(self, obj):
        return sum(c.amount for c in obj.contributions.all())


class TontineSerializer(serializers.ModelSerializer):
    organizer = MemberMinimalSerializer(read_only=True)
    member_count = serializers.SerializerMethodField()
    is_member = serializers.SerializerMethodField()

    class Meta:
        model = Tontine
        fields = [
            'id', 'name', 'description', 'organizer', 'contribution_amount',
            'currency', 'frequency', 'start_date', 'max_members', 'status',
            'member_count', 'is_member', 'created_at',
        ]
        read_only_fields = ['organizer', 'status', 'created_at']

    @extend_schema_field(serializers.IntegerField())
    def get_member_count(self, obj):
        return obj.members.count()

    @extend_schema_field(serializers.BooleanField())
    def get_is_member(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.members.filter(pk=request.user.pk).exists()
        return False


class TontineDetailSerializer(TontineSerializer):
    memberships = TontineMembershipSerializer(
        source='tontinemembership_set', many=True, read_only=True
    )
    rounds = TontineRoundSerializer(many=True, read_only=True)

    class Meta(TontineSerializer.Meta):
        fields = TontineSerializer.Meta.fields + ['memberships', 'rounds']
