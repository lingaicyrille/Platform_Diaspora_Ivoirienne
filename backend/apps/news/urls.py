from rest_framework.routers import DefaultRouter
from .views import ArticleViewSet, TagViewSet

router = DefaultRouter()
router.register(r'articles', ArticleViewSet, basename='article')
router.register(r'tags', TagViewSet, basename='tag')

urlpatterns = router.urls
