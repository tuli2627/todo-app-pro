import requests
from django.conf import settings
from django.contrib.auth import authenticate
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken

class CustomLoginView(APIView):
    def post(self, request):
        username = request.data.get('userid')  # Frontend userid bhej raha hai
        password = request.data.get('password')
        captcha_token = request.data.get('captcha_token')

        if not username or not password or not captcha_token:
            return Response({"error": "Missing userid, password, or captcha"}, status=status.HTTP_400_BAD_REQUEST)

        recaptcha_verify_url = 'https://www.google.com/recaptcha/api/siteverify'
        recaptcha_data = {
            'secret': settings.RECAPTCHA_SECRET_KEY,
            'response': captcha_token
        }
        
        try:
            google_response = requests.post(recaptcha_verify_url, data=recaptcha_data)
            verification_result = google_response.json()
            
            if not verification_result.get('success'):
                return Response({"error": "CAPTCHA verification failed. Are you a robot?"}, 
                                status=status.HTTP_400_BAD_REQUEST)
        except requests.exceptions.RequestException:
            return Response({"error": "Could not connect to reCAPTCHA service."}, 
                            status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        # Triggers CampaNationalAuthBackend
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
                    'role': getattr(user, 'role_name', ''),
                    'user_type': 'National'
                }
            }, status=status.HTTP_200_OK)
            
        return Response({"error": "Invalid User ID or Password Information"}, status=status.HTTP_401_UNAUTHORIZED)