from django.db.models import Avg
from drf_spectacular.utils import extend_schema_field
from rest_framework import serializers
from .models import Business, Review


class ReviewAuthorSerializer(serializers.Serializer):
    id = serializers.IntegerField(read_only=True)
    first_name = serializers.CharField(read_only=True)
    last_name = serializers.CharField(read_only=True)


class ReviewSerializer(serializers.ModelSerializer):
    author = ReviewAuthorSerializer(read_only=True)

    class Meta:
        model = Review
        fields = ['id', 'business', 'author', 'rating', 'comment', 'created_at']
        read_only_fields = ['id', 'author', 'created_at']

    def validate_rating(self, value):
        if value < 1 or value > 5:
            raise serializers.ValidationError("Rating must be between 1 and 5.")
        return value


class OwnerSerializer(serializers.Serializer):
    id = serializers.IntegerField(read_only=True)
    first_name = serializers.CharField(read_only=True)
    last_name = serializers.CharField(read_only=True)


class BusinessSerializer(serializers.ModelSerializer):
    owner = OwnerSerializer(read_only=True)
    average_rating = serializers.SerializerMethodField()
    review_count = serializers.SerializerMethodField()

    class Meta:
        model = Business
        fields = [
            'id', 'name', 'owner', 'description', 'category', 'address',
            'country', 'city', 'phone', 'website', 'email', 'logo',
            'is_verified', 'created_at', 'updated_at',
            'average_rating', 'review_count',
        ]
        read_only_fields = ['id', 'owner', 'is_verified', 'created_at', 'updated_at']

    @extend_schema_field(serializers.FloatField())
    def get_average_rating(self, obj):
        avg = obj.reviews.aggregate(avg=Avg('rating'))['avg']
        return round(avg, 1) if avg is not None else 0.0

    @extend_schema_field(serializers.IntegerField())
    def get_review_count(self, obj):
        return obj.reviews.count()
