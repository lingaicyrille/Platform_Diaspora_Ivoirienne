from rest_framework.routers import DefaultRouter

from .views import SolidarityFundViewSet

router = DefaultRouter()
router.register(r'funds', SolidarityFundViewSet, basename='solidarity-fund')

urlpatterns = router.urls
