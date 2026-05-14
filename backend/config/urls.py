from django.contrib import admin
from django.urls import path, include
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView
from core.health import health_check

urlpatterns = [
    path('api/health/', health_check, name='health-check'),
    path('admin/', admin.site.urls),
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('api/users/', include('apps.users.urls')),
    path('api/community/', include('apps.community.urls')),
    path('api/associations/', include('apps.associations.urls')),
    path('api/events/', include('apps.events.urls')),
    path('api/business/', include('apps.business.urls')),
    path('api/marketplace/', include('apps.marketplace.urls')),
    path('api/immigration/', include('apps.immigration.urls')),
    path('api/news/', include('apps.news.urls')),
    path('api/messaging/', include('apps.messaging.urls')),
    path('api/help/', include('apps.help.urls')),
    path('api/ads/', include('apps.ads.urls')),
    path('api/notifications/', include('apps.notifications.urls')),
    path('api/tontine/', include('apps.tontine.urls')),
    path('api/solidarity/', include('apps.solidarity.urls')),
    path('api/mentorship/', include('apps.mentorship.urls')),
]
