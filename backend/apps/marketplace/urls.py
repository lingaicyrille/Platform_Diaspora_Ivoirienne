from rest_framework.routers import DefaultRouter

from .views import ListingViewSet, OfferViewSet

router = DefaultRouter()
router.register(r'listings', ListingViewSet, basename='listing')
router.register(r'offers', OfferViewSet, basename='offer')

urlpatterns = router.urls
