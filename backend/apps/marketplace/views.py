from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError, PermissionDenied
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import Listing, Offer
from .serializers import ListingSerializer, OfferSerializer


class ListingViewSet(viewsets.ModelViewSet):
    serializer_class = ListingSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = Listing.objects.filter(is_active=True).select_related('seller')
        category = self.request.query_params.get('category')
        condition = self.request.query_params.get('condition')
        min_price = self.request.query_params.get('min_price')
        max_price = self.request.query_params.get('max_price')
        if category:
            qs = qs.filter(category=category)
        if condition:
            qs = qs.filter(condition=condition)
        if min_price:
            qs = qs.filter(price__gte=min_price)
        if max_price:
            qs = qs.filter(price__lte=max_price)
        return qs

    def perform_create(self, serializer):
        serializer.save(seller=self.request.user)

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def make_offer(self, request, pk=None):
        listing = self.get_object()
        if listing.seller == request.user:
            raise ValidationError("You cannot make an offer on your own listing.")
        serializer = OfferSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        offer = serializer.save(listing=listing, buyer=request.user)
        return Response(OfferSerializer(offer).data, status=status.HTTP_201_CREATED)


class OfferViewSet(viewsets.ModelViewSet):
    serializer_class = OfferSerializer
    permission_classes = [IsAuthenticated]
    http_method_names = ['get', 'patch', 'delete', 'head', 'options']

    def get_queryset(self):
        qs = Offer.objects.all().select_related('buyer', 'listing', 'listing__seller')
        listing_id = self.request.query_params.get('listing')
        if listing_id:
            qs = qs.filter(listing_id=listing_id)
        return qs

    def partial_update(self, request, *args, **kwargs):
        offer = self.get_object()
        if offer.listing.seller != request.user:
            raise PermissionDenied("Only the listing owner can update offer status.")
        return super().partial_update(request, *args, **kwargs)
