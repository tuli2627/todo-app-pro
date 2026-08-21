"""
Django settings for backend project — pro/production-ready config.

Reads sensitive values from environment (.env) instead of hardcoding them.
"""

import os
from pathlib import Path
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent

load_dotenv(BASE_DIR / '.env')

# ---------------------------------------------------------------------------
# Core
# ---------------------------------------------------------------------------

SECRET_KEY = os.getenv('SECRET_KEY', 'unsafe-fallback-key-for-dev-only')

DEBUG = os.getenv('DEBUG', 'False') == 'True'

ALLOWED_HOSTS = os.getenv('ALLOWED_HOSTS', 'localhost,127.0.0.1').split(',')

# ---------------------------------------------------------------------------
# Applications
# ---------------------------------------------------------------------------

INSTALLED_APPS = [
    # 'django.contrib.admin',
    'django.contrib.auth',  # Django's native authentication engine
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',

    # Third-party
    'rest_framework',
    'corsheaders',

    # Local — Using explicit nested module routing paths to protect app registry
    'common',
    'todos',
    'auth.apps.AuthConfig'  # App ka naam 'auth' hai
]

# ---------------------------------------------------------------------------
# Middleware
# ---------------------------------------------------------------------------

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',

    # Custom project middleware
    'common.middleware.RequestLoggingMiddleware',
    'common.middleware.ExceptionLoggingMiddleware',
]

AUTHENTICATION_BACKENDS = [
    'auth.backends.CampaNationalAuthBackend',  # Ab sirf National DB/API check karega
    'django.contrib.auth.backends.ModelBackend', # Default Django admin/superusers ke liye
]

# 👇 YAHAN THEEK KIYA GAYA HAI (backend_auth ki jagah sirf auth aayega) 👇
AUTH_USER_MODEL = 'backend_auth.CampaNationalUser'
ROOT_URLCONF = 'backend.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
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

WSGI_APPLICATION = 'backend.wsgi.application'

# ---------------------------------------------------------------------------
# Database
# ---------------------------------------------------------------------------

DATABASES = {
    'default': {
        'ENGINE': 'mssql',
        'NAME': 'dbOSTPM',  # Jo database abhi restore kiya hai
        'HOST': 'localhost',                
        'PORT': '',
        'OPTIONS': {
            'driver': 'ODBC Driver 17 for SQL Server', # Agar error aaye toh '13' ya '18' try karna
            'extra_params': 'Trusted_Connection=yes;TrustServerCertificate=yes;',
        },
    }
}

# ---------------------------------------------------------------------------
# Password validation
# ---------------------------------------------------------------------------

AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

# ---------------------------------------------------------------------------
# I18N
# ---------------------------------------------------------------------------

LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'Asia/Kolkata'
USE_I18N = True
USE_TZ = True

# ---------------------------------------------------------------------------
# Static files
# ---------------------------------------------------------------------------

STATIC_URL = 'static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# ---------------------------------------------------------------------------
# CORS — driven entirely by .env, no hardcoded origins in code
# ---------------------------------------------------------------------------

CORS_ALLOWED_ORIGINS = [
    origin.strip()
    for origin in os.getenv('CORS_ALLOWED_ORIGINS', 'http://localhost:3000').split(',')
    if origin.strip()
]

CORS_ALLOW_CREDENTIALS = os.getenv('CORS_ALLOW_CREDENTIALS', 'False') == 'True'

CORS_ALLOW_METHODS = [
    'GET',
    'POST',
    'PUT',
    'PATCH',
    'DELETE',
    'OPTIONS',
]

CORS_ALLOW_HEADERS = [
    'accept',
    'authorization',
    'content-type',
    'origin',
    'x-csrftoken',
    'x-requested-with',
]

# ---------------------------------------------------------------------------
# Django REST Framework
# ---------------------------------------------------------------------------

REST_FRAMEWORK = {
    'DEFAULT_PAGINATION_CLASS': 'common.pagination.StandardResultsPagination',
    'PAGE_SIZE': 10,
    'EXCEPTION_HANDLER': 'common.exceptions.custom_exception_handler',
    'DEFAULT_RENDERER_CLASSES': [
        'rest_framework.renderers.JSONRenderer',
        'rest_framework.renderers.BrowsableAPIRenderer',
    ],
}
SIMPLE_JWT = {
    'USER_ID_FIELD': 'login_id',
    'USER_ID_CLAIM': 'user_id',
}

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------

LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '[{asctime}] {levelname} {name} — {message}',
            'style': '{',
        },
    },
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
            'formatter': 'verbose',
        },
    },
    'root': {
        'handlers': ['console'],
        'level': 'INFO',
    },
    'loggers': {
        'django': {
            'handlers': ['console'],
            'level': 'INFO',
            'propagate': False,
        },
        'common': {
            'handlers': ['console'],
            'level': 'INFO',
            'propagate': False,
        },
    },
}

# ---------------------------------------------------------------------------
# Google reCAPTCHA
# ---------------------------------------------------------------------------

# Google reCAPTCHA v2 Secret Key
RECAPTCHA_SECRET_KEY = '6LfCIHUtAAAAANqXloxdFytoKShd0M0OFr_YEXaO'
CORS_ALLOW_ALL_ORIGINS = True