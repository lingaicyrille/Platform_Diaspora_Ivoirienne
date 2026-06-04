from django.utils import timezone
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.pagination import PageNumberPagination
from rest_framework.permissions import IsAuthenticated, IsAdminUser, AllowAny
from rest_framework.response import Response

from .models import Article, Tag
from .serializers import ArticleSerializer, TagSerializer


class StandardPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100


class TagViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Tag.objects.all()
    serializer_class = TagSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = StandardPagination


class ArticleViewSet(viewsets.ModelViewSet):
    serializer_class = ArticleSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = StandardPagination

    def get_queryset(self):
        qs = Article.objects.select_related('author').prefetch_related('tags')
        category = self.request.query_params.get('category')
        tag = self.request.query_params.get('tag')
        published_only = self.request.query_params.get('published', 'true')
        published_date = self.request.query_params.get('published_date')

        if published_only.lower() != 'false':
            qs = qs.filter(is_published=True)
        if category:
            qs = qs.filter(category=category)
        if tag:
            qs = qs.filter(tags__name__iexact=tag)
        if published_date:
            qs = qs.filter(published_at__date=published_date)
        return qs

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)

    @action(detail=True, methods=['post'], permission_classes=[IsAdminUser])
    def publish(self, request, pk=None):
        article = self.get_object()
        article.is_published = True
        article.published_at = timezone.now()
        article.save()
        return Response(ArticleSerializer(article).data)

    @action(detail=True, methods=['post'], permission_classes=[IsAdminUser])
    def unpublish(self, request, pk=None):
        article = self.get_object()
        article.is_published = False
        article.published_at = None
        article.save()
        return Response(ArticleSerializer(article).data)
