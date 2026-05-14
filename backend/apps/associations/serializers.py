from drf_spectacular.utils import extend_schema_field
from rest_framework import serializers
from .models import Association, AssociationMember


class _UserBriefSerializer(serializers.Serializer):
    id = serializers.IntegerField(read_only=True)
    first_name = serializers.CharField(read_only=True)
    last_name = serializers.CharField(read_only=True)


class AssociationMemberSerializer(serializers.ModelSerializer):
    user = _UserBriefSerializer(read_only=True)

    class Meta:
        model = AssociationMember
        fields = ['id', 'association', 'user', 'role', 'joined_at']


class AssociationSerializer(serializers.ModelSerializer):
    created_by = _UserBriefSerializer(read_only=True)
    member_count = serializers.SerializerMethodField()
    is_member = serializers.SerializerMethodField()

    class Meta:
        model = Association
        fields = [
            'id', 'name', 'description', 'category', 'country', 'city',
            'logo', 'website', 'contact_email', 'is_verified', 'created_by',
            'created_at', 'updated_at', 'member_count', 'is_member',
        ]

    @extend_schema_field(serializers.IntegerField())
    def get_member_count(self, obj):
        return obj.members.count()

    @extend_schema_field(serializers.BooleanField())
    def get_is_member(self, obj):
        request = self.context.get('request')
        if request and request.user and request.user.is_authenticated:
            return obj.members.filter(user=request.user).exists()
        return False
