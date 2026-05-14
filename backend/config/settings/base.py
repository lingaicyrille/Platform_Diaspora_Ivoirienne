import os
from datetime import timedelta
from pathlib import Path

import environ
import cloudinary

BASE_DIR = Path(__file__).resolve().parent.parent.parent

env = environ.Env(DEBUG=(bool, False))
# read_env only needed for local dev outside Docker; in Docker, compose injects vars directly
_env_file = BASE_DIR.parent / '.env'
if _env_file.exists():
    environ.Env.read_env(str(_env_file))

SECRET_KEY = env('SECRET_KEY')
DEBUG = env('DEBUG')
ALLOWED_HOSTS = env.list('ALLOWED_HOSTS', default=['localhost', '127.0.0.1'])

DJANGO_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
]

THIRD_PARTY_APPS = [
    'rest_framework',
    'rest_framework_simplejwt',
    'rest_framework_simplejwt.token_blacklist',
    'corsheaders',
    'channels',
    'cloudinary_storage',
    'cloudinary',
    'drf_spectacular',
    'django_filters',
]

LOCAL_APPS = [
    'apps.users',
    'apps.community',
    'apps.associations',
    'apps.events',
    'apps.business',
    'apps.marketplace',
    'apps.immigration',
    'apps.news',
    'apps.messaging',
    'apps.help',
    'apps.ads',
    'apps.notifications',
    'apps.tontine',
    'apps.solidarity',
    'apps.mentorship',
]

INSTALLED_APPS = DJANGO_APPS + THIRD_PARTY_APPS + LOCAL_APPS

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'config.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR / 'templates'],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'config.wsgi.application'
ASGI_APPLICATION = 'config.asgi.application'

DATABASES = {
    'default': env.db('DATABASE_URL')
}

AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

AUTH_USER_MODEL = 'users.User'

LANGUAGE_CODE = 'fr'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# ─── REST Framework ───────────────────────────────────────
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
    'DEFAULT_SCHEMA_CLASS': 'drf_spectacular.openapi.AutoSchema',
    'DEFAULT_FILTER_BACKENDS': ['django_filters.rest_framework.DjangoFilterBackend'],
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 20,
}

# ─── JWT ──────────────────────────────────────────────────
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(
        minutes=env.int('JWT_ACCESS_TOKEN_LIFETIME_MINUTES', default=60)
    ),
    'REFRESH_TOKEN_LIFETIME': timedelta(
        days=env.int('JWT_REFRESH_TOKEN_LIFETIME_DAYS', default=7)
    ),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
    'AUTH_HEADER_TYPES': ('Bearer',),
}

# ─── Cloudinary ───────────────────────────────────────────
cloudinary.config(
    cloud_name=env('CLOUDINARY_CLOUD_NAME', default=''),
    api_key=env('CLOUDINARY_API_KEY', default=''),
    api_secret=env('CLOUDINARY_API_SECRET', default=''),
    secure=True,
)
STORAGES = {
    'default': {'BACKEND': 'cloudinary_storage.storage.MediaCloudinaryStorage'},
    'staticfiles': {'BACKEND': 'whitenoise.storage.CompressedManifestStaticFilesStorage'},
}

# ─── Redis / Channels ─────────────────────────────────────
CHANNEL_LAYERS = {
    'default': {
        'BACKEND': 'channels_redis.core.RedisChannelLayer',
        'CONFIG': {
            'hosts': [env('REDIS_URL', default='redis://localhost:6379/0')],
        },
    },
}

CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.redis.RedisCache',
        'LOCATION': env('REDIS_URL', default='redis://localhost:6379/1'),
    }
}

# ─── CORS ─────────────────────────────────────────────────
CORS_ALLOWED_ORIGINS = env.list(
    'CORS_ALLOWED_ORIGINS', default=['http://localhost:3000']
)
CORS_ALLOW_CREDENTIALS = True

# ─── API Docs ─────────────────────────────────────────────
SPECTACULAR_SETTINGS = {
    'TITLE': 'Platform Diaspora Ivoirienne API',
    'DESCRIPTION': 'API for the Ivorian Diaspora Platform',
    'VERSION': '1.0.0',
    'ENUM_NAME_OVERRIDES': {
        'EventCategoryEnum': 'apps.events.models.EventCategory',
        'RSVPStatusEnum': 'apps.events.models.RSVPStatus',
        'HelpCategoryEnum': 'apps.help.models.HelpCategory',
        'HelpUrgencyEnum': 'apps.help.models.Urgency',
        'HelpRequestStatusEnum': 'apps.help.models.RequestStatus',
        'TontineStatusEnum': 'apps.tontine.models.TontineStatus',
        'TontineFrequencyEnum': 'apps.tontine.models.TontineFrequency',
        'RoundStatusEnum': 'apps.tontine.models.RoundStatus',
        'FundStatusEnum': 'apps.solidarity.models.FundStatus',
        'FundCategoryEnum': 'apps.solidarity.models.FundCategory',
        'MentorshipRequestStatusEnum': 'apps.mentorship.models.RequestStatus',
        'MentorshipAreaEnum': 'apps.mentorship.models.MentorshipArea',
        'NotificationTypeEnum': 'apps.notifications.models.NotificationType',
        'NewsCategoryEnum': 'apps.news.models.ArticleCategory',
        'AdPlacementEnum': 'apps.ads.models.Placement',
    },
}

# ─── Email ────────────────────────────────────────────────
EMAIL_BACKEND = env('EMAIL_BACKEND', default='django.core.mail.backends.console.EmailBackend')
EMAIL_HOST = env('EMAIL_HOST', default='smtp.gmail.com')
EMAIL_PORT = env.int('EMAIL_PORT', default=587)
EMAIL_USE_TLS = env.bool('EMAIL_USE_TLS', default=True)
EMAIL_HOST_USER = env('EMAIL_HOST_USER', default='')
EMAIL_HOST_PASSWORD = env('EMAIL_HOST_PASSWORD', default='')
DEFAULT_FROM_EMAIL = env('DEFAULT_FROM_EMAIL', default='noreply@pdi-diaspora.com')
FRONTEND_URL = env('FRONTEND_URL', default='http://localhost:3000')

# ─── Celery ───────────────────────────────────────────────
CELERY_BROKER_URL = env('REDIS_URL', default='redis://localhost:6379/0')
CELERY_RESULT_BACKEND = env('REDIS_URL', default='redis://localhost:6379/0')
CELERY_ACCEPT_CONTENT = ['json']
CELERY_TASK_SERIALIZER = 'json'
CELERY_RESULT_SERIALIZER = 'json'
CELERY_TIMEZONE = TIME_ZONE
