# import requests
# from django.contrib.auth.backends import BaseBackend
# from .models import CampaNationalUser

# class CampaNationalAuthBackend(BaseBackend):
#     def authenticate(self, request, username=None, password=None, **kwargs):
#         if not username or not password:
#             return None

#         # Step 1: Check in Local Database First
#         try:
#             user = CampaNationalUser.objects.get(login_id=username)
#             if user.check_password(password):
#                 return user
#         except CampaNationalUser.DoesNotExist:
#             pass

#         # Step 2: Call Parivesh API if not found locally
#         api_url = settings.PARIVESH_LOGIN_URL

#         try:
#             payload = {"username": username, "password": password}
#             response = requests.post(api_url, json=payload, timeout=10)
            
#             if response.status_code == 200:
#                 api_data = response.json()
                
#                 if api_data.get("status") == 200 and "data" in api_data:
#                     user_info = api_data["data"]
                    
#                     role_list = user_info.get("roleName", [])
#                     role_str = role_list[0] if isinstance(role_list, list) and len(role_list) > 0 else ""

#                    # Step 3: Save User in Local DB (Role_name yahan se hata diya hai)
#                     user, created = CampaNationalUser.objects.get_or_create(
#                         login_id=user_info.get("username", username),
#                         defaults={
#                             'userid': user_info.get("userid"),
#                             'username': user_info.get("name"),
#                             'status': 1
#                         }
#                     )
#                     user.set_password(password)
#                     user.save()
#                     return user
#         except requests.RequestException:
#             return None
            
#         return None

#     def get_user(self, user_id):
#         try:
#             return CampaNationalUser.objects.get(pk=user_id)
#         except CampaNationalUser.DoesNotExist:
#             return None
import logging

import requests
from django.conf import settings
from django.contrib.auth.backends import BaseBackend
from django.core.exceptions import ImproperlyConfigured
from .models import CampaNationalUser

logger = logging.getLogger(__name__)


class CampaNationalAuthBackend(BaseBackend):
    def authenticate(self, request, username=None, password=None, **kwargs):
        if not username or not password:
            return None

        # Step 1: Check in Local Database First
        try:
            user = CampaNationalUser.objects.get(login_id=username)
            if user.check_password(password):
                return user
        except CampaNationalUser.DoesNotExist:
            pass

        if not settings.PARIVESH_SECRET_KEY:
            raise ImproperlyConfigured(
                "PARIVESH_SECRET_KEY is required for external authentication."
            )

        try:
            payload = {"username": username, "password": password}
            response = requests.post(
                settings.PARIVESH_LOGIN_URL,
                params={"secretKey": settings.PARIVESH_SECRET_KEY},
                json=payload,
                timeout=10,
            )
            
            if response.status_code == 200:
                api_data = response.json()
                
                if api_data.get("status") == 200 and "data" in api_data:
                    user_info = api_data["data"]

                    # Step 3: Save User in Local DB
                    user, created = CampaNationalUser.objects.get_or_create(
                        login_id=user_info.get("username", username),
                        defaults={
                            'userid': user_info.get("userid"),
                            'username': user_info.get("userid"),
                            'status': 1,
                            'state': user_info.get("state", "N/A"),
                            'current_session_id': user_info.get("current_session_id", "")
                        }
                    )
                    user.set_password(password)
                    user.save()
                    return user
        except requests.RequestException:
            logger.warning("PARIVESH authentication request failed.")
            return None
            
        return None

    def get_user(self, user_id):
        try:
            return CampaNationalUser.objects.get(pk=user_id)
        except CampaNationalUser.DoesNotExist:
            return None