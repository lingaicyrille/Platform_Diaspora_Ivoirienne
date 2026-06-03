from django.db.models import Avg
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from rest_framework.pagination import PageNumberPagination
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.response import Response

from .models import Business, Review
from .serializers import BusinessSerializer, ReviewSerializer


class StandardPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100


class BusinessViewSet(viewsets.ModelViewSet):
    serializer_class = BusinessSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = StandardPagination

    def get_queryset(self):
        qs = Business.objects.all().select_related('owner').prefetch_related('reviews')
        params = self.request.query_params

        category = params.get('category')
        country = params.get('country')
        city = params.get('city')
        search = params.get('search')
        min_rating = params.get('min_rating')

        if category:
            qs = qs.filter(category=category)
        if country:
            qs = qs.filter(country__iexact=country)
        if city:
            qs = qs.filter(city__icontains=city)
        if search:
            qs = qs.filter(name__icontains=search)
        if min_rating:
            qs = qs.annotate(avg=Avg('reviews__rating')).filter(avg__gte=float(min_rating))

        return qs

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)

    @action(detail=True, methods=['post'], permission_classes=[IsAdminUser])
    def verify(self, request, pk=None):
        business = self.get_object()
        business.is_verified = True
        business.save()
        serializer = self.get_serializer(business)
        return Response(serializer.data, status=status.HTTP_200_OK)


class ReviewViewSet(viewsets.ModelViewSet):
    serializer_class = ReviewSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = StandardPagination
    http_method_names = ['get', 'post', 'delete', 'head', 'options']

    def get_queryset(self):
        qs = Review.objects.all().select_related('author', 'business')
        business_id = self.request.query_params.get('business')
        if business_id:
            qs = qs.filter(business_id=business_id)
        return qs

    def perform_create(self, serializer):
        business = serializer.validated_data.get('business')
        if business and business.owner == self.request.user:
            raise ValidationError("Vous ne pouvez pas évaluer votre propre entreprise.")
        if business and Review.objects.filter(business=business, author=self.request.user).exists():
            raise ValidationError("Vous avez déjà évalué cette entreprise.")
        serializer.save(author=self.request.user)
