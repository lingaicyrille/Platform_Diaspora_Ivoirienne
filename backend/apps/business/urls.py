from rest_framework.routers import DefaultRouter

from .views import BusinessViewSet, ReviewViewSet

router = DefaultRouter()
router.register(r'businesses', BusinessViewSet, basename='business')
router.register(r'reviews', ReviewViewSet, basename='review')

urlpatterns = router.urls
