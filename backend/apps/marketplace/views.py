from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError, PermissionDenied
from rest_framework.pagination import PageNumberPagination
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import Listing, Offer
from .serializers import ListingSerializer, OfferSerializer


class StandardPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100


class ListingViewSet(viewsets.ModelViewSet):
    serializer_class = ListingSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = StandardPagination

    def get_queryset(self):
        qs = Listing.objects.filter(is_active=True).select_related('seller').prefetch_related('offers')
        params = self.request.query_params

        category = params.get('category')
        condition = params.get('condition')
        min_price = params.get('min_price')
        max_price = params.get('max_price')
        location = params.get('location')

        if category:
            qs = qs.filter(category=category)
        if condition:
            qs = qs.filter(condition=condition)
        if min_price:
            qs = qs.filter(price__gte=min_price)
        if max_price:
            qs = qs.filter(price__lte=max_price)
        if location:
            qs = qs.filter(location__icontains=location)

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
    pagination_class = StandardPagination
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
