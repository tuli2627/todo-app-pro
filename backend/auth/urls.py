# from django.urls import path
# from rest_framework.routers import DefaultRouter

# router = DefaultRouter()


# urlpatterns = [
# ]

# urlpatterns += router.urls
from django.urls import path
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView

# 1. Import your CustomLoginView from your views.py file
from .views import CustomLoginView 

router = DefaultRouter()
# Agar aage chal kar aap koi ViewSet banate hain, toh use yahan register karein
# router.register(r'users', UserViewSet)

urlpatterns = [
    # 2. Custom login endpoint (Handles both DFO & National users + CAPTCHA)
    path('api/login/', CustomLoginView.as_view(), name='custom_login'),
    
    # 3. JWT Token Refresh Endpoint (Bahut zaroori hai frontend ke liye)
    # Jab 'access' token expire ho jaye, toh frontend 'refresh' token is URL par bhej kar naya token le sakta hai
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
]

urlpatterns += router.urls