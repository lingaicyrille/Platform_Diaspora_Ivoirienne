from drf_spectacular.utils import extend_schema_field
from rest_framework import serializers
from .models import Listing, ListingImage, Offer


class SellerSerializer(serializers.Serializer):
    id = serializers.IntegerField(read_only=True)
    first_name = serializers.CharField(read_only=True)
    last_name = serializers.CharField(read_only=True)


class ListingImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ListingImage
        fields = ['id', 'image']


class ListingSerializer(serializers.ModelSerializer):
    seller = SellerSerializer(read_only=True)
    offer_count = serializers.SerializerMethodField()
    images = ListingImageSerializer(many=True, read_only=True)

    class Meta:
        model = Listing
        fields = [
            'id', 'title', 'seller', 'description', 'price', 'currency',
            'category', 'condition', 'image', 'images', 'location', 'is_active',
            'created_at', 'updated_at', 'offer_count',
        ]
        read_only_fields = ['id', 'seller', 'created_at', 'updated_at']

    @extend_schema_field(serializers.IntegerField())
    def get_offer_count(self, obj):
        return obj.offers.count()


class BuyerSerializer(serializers.Serializer):
    id = serializers.IntegerField(read_only=True)
    first_name = serializers.CharField(read_only=True)
    last_name = serializers.CharField(read_only=True)


class OfferSerializer(serializers.ModelSerializer):
    buyer = BuyerSerializer(read_only=True)
    listing = serializers.PrimaryKeyRelatedField(read_only=True)

    class Meta:
        model = Offer
        fields = ['id', 'listing', 'buyer', 'amount', 'message', 'status', 'created_at']
        read_only_fields = ['id', 'buyer', 'listing', 'created_at']
