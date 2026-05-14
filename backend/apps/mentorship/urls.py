from rest_framework.routers import DefaultRouter

from .views import MentorProfileViewSet, MentorshipRequestViewSet

router = DefaultRouter()
router.register(r'profiles', MentorProfileViewSet, basename='mentor-profile')
router.register(r'requests', MentorshipRequestViewSet, basename='mentorship-request')

urlpatterns = router.urls
