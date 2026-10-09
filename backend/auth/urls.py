
from django.urls import path
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView

from .views import (
    PariveshLoginView,
    ROLoginView,
    RORegistrationView,
    SilviculturistLoginView,
    SilviculturistRegistrationView,
)


router = DefaultRouter()
# Agar aage chal kar aap koi ViewSet banate hain, toh use yahan register karein
# router.register(r'users', UserViewSet)

urlpatterns = [
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('ro-register/', RORegistrationView.as_view(), name='ro_register'),
    path('ro-login/', ROLoginView.as_view(), name='ro_login'),
    path(
    'silviculturist-register/',
    SilviculturistRegistrationView.as_view(),
    name='silviculturist_register'
),
path(
    'silviculturist-login/',
    SilviculturistLoginView.as_view(),
    name='silviculturist_login'
),
path(
    'parivesh-login/',
    PariveshLoginView.as_view(),
    name='parivesh_login'
),
]
    
urlpatterns += router.urls