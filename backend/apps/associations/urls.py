from rest_framework.routers import DefaultRouter
from .views import AssociationViewSet, AssociationMemberViewSet

router = DefaultRouter()
router.register(r'associations', AssociationViewSet, basename='association')
router.register(r'members', AssociationMemberViewSet, basename='associationmember')

urlpatterns = router.urls
