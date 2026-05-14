from rest_framework.routers import DefaultRouter

from .views import TontineViewSet, TontineRoundViewSet

router = DefaultRouter()
router.register(r'tontines', TontineViewSet, basename='tontine')
router.register(r'rounds', TontineRoundViewSet, basename='tontine-round')

urlpatterns = router.urls
