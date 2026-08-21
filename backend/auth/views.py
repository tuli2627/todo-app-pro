import requests
from django.conf import settings
from django.contrib.auth import authenticate
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken

class CustomLoginView(APIView):
    def post(self, request):
        username = request.data.get('userid') 
        password = request.data.get('password')
        captcha_token = request.data.get('captcha_token')

        if not username or not password or not captcha_token:
            return Response({"error": "Missing userid, password, or captcha"}, status=status.HTTP_400_BAD_REQUEST)
        user = authenticate(request=request, username=username, password=password)

        if user is not None:
            refresh = RefreshToken.for_user(user)
            
            return Response({
                'refresh': str(refresh),
                'access': str(refresh.access_token),
                'user': {
                    'userid': user.login_id,
                    'name': user.username or '',
                    'email': user.login_id,
                    'role': '', 
                    'user_type': 'National',
                }
            }, status=status.HTTP_200_OK)
            
        return Response({"error": "Invalid User ID or Password Information"}, status=status.HTTP_401_UNAUTHORIZED)