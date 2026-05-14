from rest_framework.routers import DefaultRouter
from .views import GroupViewSet, PostViewSet, CommentViewSet, ReactionViewSet

router = DefaultRouter()
router.register(r'groups', GroupViewSet, basename='group')
router.register(r'posts', PostViewSet, basename='post')
router.register(r'comments', CommentViewSet, basename='comment')
router.register(r'reactions', ReactionViewSet, basename='reaction')

urlpatterns = router.urls
