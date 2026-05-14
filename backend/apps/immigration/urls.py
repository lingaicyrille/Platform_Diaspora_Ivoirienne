from rest_framework.routers import DefaultRouter

from .views import CountryViewSet, ImmigrationGuideViewSet, ImmigrationQuestionViewSet, ImmigrationAnswerViewSet

router = DefaultRouter()
router.register(r'countries', CountryViewSet, basename='country')
router.register(r'guides', ImmigrationGuideViewSet, basename='immigrationguide')
router.register(r'questions', ImmigrationQuestionViewSet, basename='immigrationquestion')
router.register(r'answers', ImmigrationAnswerViewSet, basename='immigrationanswer')

urlpatterns = router.urls
