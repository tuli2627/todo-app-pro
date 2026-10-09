
# import requests
# from django.db.models import Q
# from django.conf import settings
# from rest_framework import response
# from rest_framework import response
# from rest_framework.views import APIView
# from rest_framework.response import Response
# from rest_framework import status
# from rest_framework_simplejwt.tokens import RefreshToken
# from .models import CampaNationalUser, CampaRoUser, CampaSilviculturistUser # Ensure this import matches your app structure

# class CustomLoginView(APIView):
#     def post(self, request):
#         username_input = request.data.get('userid') 
#         password = request.data.get('password')
#         captcha_token = request.data.get('captcha_token')

#         if not username_input or not password or not captcha_token:
#             return Response({"error": "Missing userid, password, or captcha"}, status=status.HTTP_400_BAD_REQUEST)

#         user = None
        
#         # Check if input is a numeric ID to prevent BigIntegerField casting errors
#         if username_input.isdigit():
#             user = CampaNationalUser.objects.filter(
#                 Q(login_id=username_input) | Q(userid=username_input)
#             ).first()
#         else:
#             # If it contains text/characters (like an email), only search login_id
#             user = CampaNationalUser.objects.filter(login_id=username_input).first()

#         # Check if user exists and password matches
#         if user and user.check_password(password):
#             refresh = RefreshToken.for_user(user)
            
#             return Response({
#                 'refresh': str(refresh),
#                 'access': str(refresh.access_token),
#                 'user': {
#                     'userid': user.login_id,
#                     'name': user.username or '',
#                     'email': user.login_id,
#                     'role': 'National', 
#                     'user_type': 'National',
#                 }
#             }, status=status.HTTP_200_OK)
            
#         return Response({"error": "Invalid User ID or Password Information"}, status=status.HTTP_401_UNAUTHORIZED)
# class RORegistrationView(APIView):
#     def post(self, request):
#         emailid = request.data.get("emailid")
#         password = request.data.get("password")
#         confirm_password = request.data.get("confirm_password")

#         if not emailid or not password or not confirm_password:
#             return Response(
#                 {
#                     "error": "Email, password and confirm password are required."
#                 },
#                 status=status.HTTP_400_BAD_REQUEST
#             )

#         if password != confirm_password:
#             return Response(
#                 {
#                     "error": "Password and Confirm Password do not match."
#                 },
#                 status=status.HTTP_400_BAD_REQUEST
#             )

#         # Check if email is already registered
#         if CampaRoUser.objects.filter(emailid=emailid).exists():
#             return Response(
#                 {
#                     "error": "This email ID is already registered."
#                 },
#                 status=status.HTTP_400_BAD_REQUEST
#             )

#         # Create new RO user
#         user = CampaRoUser(
#             user_level=request.data.get("user_level"),
#             fname=request.data.get("fname"),
#             lname=request.data.get("lname"),
#             emailid=emailid,
#             contact_number=request.data.get("contact_number"),
#             alternate_contact_number=request.data.get(
#                 "alternate_contact_number"
#             ),
#             designation=request.data.get("designation"),
#             role=request.data.get("role", "User"),
#             is_active=True
#         )

#         # Store password securely as a hash
#         user.set_password(password)
#         user.save()

#         return Response(
#             {
#                 "message": "RO user registered successfully.",
#                 "user": {
#                     "id": user.id,
#                     "emailid": user.emailid,
#                     "fname": user.fname,
#                     "lname": user.lname,
#                     "designation": user.designation,
#                     "role": user.role
#                 }
#             },
#             status=status.HTTP_201_CREATED
#         )
# class SilviculturistRegistrationView(APIView):
#     def post(self, request):
#         emailid = request.data.get("emailid")
#         password = request.data.get("password")
#         confirm_password = request.data.get("confirm_password")

#         if not emailid or not password or not confirm_password:
#             return Response(
#                 {
#                     "error": "Email, password and confirm password are required."
#                 },
#                 status=status.HTTP_400_BAD_REQUEST
#             )

#         if password != confirm_password:
#             return Response(
#                 {
#                     "error": "Password and Confirm Password do not match."
#                 },
#                 status=status.HTTP_400_BAD_REQUEST
#             )

#         if CampaSilviculturistUser.objects.filter(emailid=emailid).exists():
#             return Response(
#                 {
#                     "error": "This email ID is already registered."
#                 },
#                 status=status.HTTP_400_BAD_REQUEST
#             )

#         user = CampaSilviculturistUser(
#             user_level="Silviculturist",
#             fname=request.data.get("fname"),
#             lname=request.data.get("lname"),
#             emailid=emailid,
#             contact_number=request.data.get("contact_number"),
#             alternate_contact_number=request.data.get(
#                 "alternate_contact_number"
#             ),
#             designation=request.data.get("designation"),
#             role=request.data.get("role", "User"),
#             is_active=True
#         )

#         user.set_password(password)
#         user.save()

#         return Response(
#             {
#                 "message": "Silviculturist user registered successfully.",
#                 "user": {
#                     "id": user.id,
#                     "emailid": user.emailid,
#                     "fname": user.fname,
#                     "lname": user.lname,
#                     "designation": user.designation,
#                     "role": user.role
#                 }
#             },
#             status=status.HTTP_201_CREATED
#         )

# class ROLoginView(APIView):
#     def post(self, request):
#         emailid = request.data.get("userid")
#         password = request.data.get("password")

#         if not emailid or not password:
#             return Response(
#                 {
#                     "success": False,
#                     "error": "Email and password are required."
#                 },
#                 status=status.HTTP_400_BAD_REQUEST
#             )

#         emailid = emailid.strip()

#         user = CampaRoUser.objects.filter(
#             emailid__iexact=emailid
#         ).first()

#         if user is None:
#             return Response(
#                 {
#                     "success": False,
#                     "error": "No RO user is registered with this email."
#                 },
#                 status=status.HTTP_401_UNAUTHORIZED
#             )

#         if not user.is_active:
#             return Response(
#                 {
#                     "success": False,
#                     "error": "This RO account is inactive."
#                 },
#                 status=status.HTTP_403_FORBIDDEN
#             )

#         if not user.check_password(password):
#             return Response(
#                 {
#                     "success": False,
#                     "error": "Invalid email or password."
#                 },
#                 status=status.HTTP_401_UNAUTHORIZED
#             )

#         refresh = RefreshToken.for_user(user)

#         full_name = f"{user.fname or ''} {user.lname or ''}".strip()

#         return Response(
#             {
#                 "success": True,
#                 "message": "RO login successful.",
#                 "refresh": str(refresh),
#                 "access": str(refresh.access_token),
#                 "user": {
#                     "id": user.id,
#                     "userid": user.emailid,
#                     "name": full_name,
#                     "email": user.emailid,
#                     "role": user.role,
#                     "user_type": "RO",
#                     "designation": user.designation or "",
#                 }
#             },
#             status=status.HTTP_200_OK
#         )

#         return Response(
#             {"error": "Invalid Email or Password."},
#             status=status.HTTP_401_UNAUTHORIZED
#         )
# class SilviculturistLoginView(APIView):
#     def post(self, request):
#         emailid = request.data.get("userid")
#         password = request.data.get("password")

#         if not emailid or not password:
#             return Response(
#                 {
#                     "success": False,
#                     "error": "Email and password are required."
#                 },
#                 status=status.HTTP_400_BAD_REQUEST
#             )

#         emailid = emailid.strip()

#         user = CampaSilviculturistUser.objects.filter(
#             emailid__iexact=emailid
#         ).first()

#         if user is None:
#             return Response(
#                 {
#                     "success": False,
#                     "error": "No Silviculturist user is registered with this email."
#                 },
#                 status=status.HTTP_401_UNAUTHORIZED
#             )

#         if not user.is_active:
#             return Response(
#                 {
#                     "success": False,
#                     "error": "This Silviculturist account is inactive."
#                 },
#                 status=status.HTTP_403_FORBIDDEN
#             )

#         if not user.check_password(password):
#             return Response(
#                 {
#                     "success": False,
#                     "error": "Invalid email or password."
#                 },
#                 status=status.HTTP_401_UNAUTHORIZED
#             )

#         refresh = RefreshToken.for_user(user)

#         full_name = f"{user.fname or ''} {user.lname or ''}".strip()

#         return Response(
#             {
#                 "success": True,
#                 "message": "Silviculturist login successful.",
#                 "refresh": str(refresh),
#                 "access": str(refresh.access_token),
#                 "user": {
#                     "id": user.id,
#                     "userid": user.emailid,
#                     "name": full_name,
#                     "email": user.emailid,
#                     "role": user.role,
#                     "user_type": "Silviculturist",
#                     "designation": user.designation or "",
#                 }
#             },
#             status=status.HTTP_200_OK
#         )

# class PariveshLoginView(APIView):
#     def post(self, request):
#         username = request.data.get("username")
#         password = request.data.get("password")

#         # Validate username and password
#         if not username or not password:
#             return Response(
#                 {
#                     "success": False,
#                     "error": "Username and password are required."
#                 },
#                 status=status.HTTP_400_BAD_REQUEST
#             )

#         try:
#             import base64

#             # PARIVESH requires the password in Base64 format
#             encoded_password = base64.b64encode(
#                 password.encode("utf-8")
#             ).decode("utf-8")

#             # Call PARIVESH Production Login API
#             response = requests.post(
#                 settings.PARIVESH_LOGIN_URL,
#                 params={
#                     "secretKey": settings.PARIVESH_SECRET_KEY
#                 },
#                 headers={
#                     "Content-Type": "application/json"
#                 },
#                 json={
#                     "username": username.strip(),
#                     "password": encoded_password
#                 },
#                 timeout=30
#             )

#             # Convert PARIVESH response to JSON
#             parivesh_data = response.json()
#             print("PARIVESH STATUS:", response.status_code)
#             print("PARIVESH RESPONSE:", parivesh_data)

#             # PARIVESH authentication failed
#             if response.status_code != 200:
#                 return Response(
#                     {
#                         "success": False,
#                         "parivesh_status": response.status_code,
#                         "parivesh_response": parivesh_data
#                     },
#                     status=status.HTTP_401_UNAUTHORIZED
#                 )
#     #         # PARIVESH authentication failed
#     #         if response.status_code != 200:
#     #                print("PARIVESH ERROR STATUS:", response.status_code)
#     #         print("PARIVESH ERROR RESPONSE:", parivesh_data)

#     #        return Response(
#     #         {
#     #         "success": False,
#     #         "parivesh_status": response.status_code,
#     #         "parivesh_response": parivesh_data},
#     #     status=response.status_code
#     # )

#             # Get data returned by PARIVESH
#             data = parivesh_data.get("data", {})

#             jwt_token = data.get("jwt")
#             role_names = data.get("roleName", [])

#             # Roles allowed to access Harit-SANKALP
#             allowed_roles = [
#                 "Nodal Officer",
#                 "DFO",
#                 "Divisional Forest Officer (DFO)",
#                 "CF",
#                 "PCCF",
#                 "State Sec",
#                 "National Campa",
#                 "CEO CAMPA"
#             ]

#             # Find an authorized role
#             user_role = None

#             for role in role_names:
#                 if role in allowed_roles:
#                     user_role = role
#                     break

#             # PARIVESH login succeeded but role is not allowed
#             if not user_role:
#                 return Response(
#                     {
#                         "success": False,
#                         "error": (
#                             "Your PARIVESH role is not authorized "
#                             "for Harit-SANKALP."
#                         ),
#                         "parivesh_roles": role_names
#                     },
#                     status=status.HTTP_403_FORBIDDEN
#                 )

#             # Get role/office details
#             role_details = data.get(
#                 "roleNameAbbreviationDtos",
#                 []
#             )

#             selected_office = None

#             for role_detail in role_details:
#                 if role_detail.get("roleName") == user_role:
#                     selected_office = role_detail
#                     break

#             # Successful Harit-SANKALP login
#             return Response(
#                 {
#                     "success": True,
#                     "message": "PARIVESH login successful.",

#                     # PARIVESH tokens
#                     "access": jwt_token,
#                     "refresh": data.get("refreshToken"),

#                     # User information
#                     "user": {
#                         "userid": data.get("userid"),
#                         "username": data.get("username"),
#                         "name": data.get("name"),

#                         # Role information
#                         "role": user_role,
#                         "roleName": role_names,

#                         # User type
#                         "userType": data.get("userType"),

#                         # State information
#                         "stateid": data.get("stateid"),
#                         "stateName": data.get("stateName"),

#                         # Office information
#                         "officeId": (
#                             selected_office.get("officeId")
#                             if selected_office
#                             else None
#                         ),

#                         "officeName": (
#                             selected_office.get("officeName")
#                             if selected_office
#                             else None
#                         ),

#                         "officeTypeId": (
#                             selected_office.get("officeTypeId")
#                             if selected_office
#                             else None
#                         ),

#                         "officeTypeName": (
#                             selected_office.get("officeTypeName")
#                             if selected_office
#                             else None
#                         ),

#                         "officeTypeAbbreviation": (
#                             selected_office.get(
#                                 "officeTypeAbbreviation"
#                             )
#                             if selected_office
#                             else None
#                         ),

#                         "roleAbbreviation": (
#                             selected_office.get(
#                                 "roleAbbreviation"
#                             )
#                             if selected_office
#                             else None
#                         ),

#                         "expiryTime": data.get("expiryTime")
#                     }
#                 },
#                 status=status.HTTP_200_OK
#             )

#         except requests.exceptions.RequestException:
#             return Response(
#                 {
#                     "success": False,
#                     "error": (
#                         "Unable to connect to the PARIVESH server."
#                     )
#                 },
#                 status=status.HTTP_502_BAD_GATEWAY
#             )

#         except ValueError:
#             return Response(
#                 {
#                     "success": False,
#                     "error": (
#                         "Invalid response received from "
#                         "the PARIVESH server."
#                     )
#                 },
#                 status=status.HTTP_502_BAD_GATEWAY
#             )

#         except Exception as e:
#             return Response(
#                 {
#                     "success": False,
#                     "error": (
#                         "An error occurred while processing "
#                         "PARIVESH login."
#                     )
#                 },
#                 status=status.HTTP_500_INTERNAL_SERVER_ERROR
#             )
import hashlib
import hmac
import logging
import re
import requests
from django.core.exceptions import ValidationError
from django.core.validators import EmailValidator
from django.db import connection, transaction
from django.conf import settings
from django.utils import timezone
from rest_framework import response
from rest_framework import response
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from .models import (
    CampaSilviculturistUser,
    T001UserMaster,
)

logger = logging.getLogger(__name__)

class RORegistrationView(APIView):
    def post(self, request):
        emailid = request.data.get("emailid") or request.data.get("email")
        password = request.data.get("password")
        confirm_password = request.data.get("confirm_password")

        fname = request.data.get("fname", "")
        lname = request.data.get("lname", "")
        if not all(
            isinstance(value, str)
            for value in (emailid, password, confirm_password, fname, lname)
        ):
            return Response(
                {"error": "Registration fields must be valid text values."},
                status=status.HTTP_400_BAD_REQUEST
            )

        emailid = emailid.strip()
        fname = fname.strip()
        lname = lname.strip()
        if not emailid or not password or not confirm_password or not fname or not lname:
            return Response(
                {
                    "error": "First name, last name, email, password and confirm password are required."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        if len(emailid) > 200 or len(fname) > 80 or len(lname) > 80:
            return Response(
                {"error": "Email and name fields exceed the allowed length."},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            EmailValidator()(emailid)
        except ValidationError:
            return Response(
                {"error": "Enter a valid email address."},
                status=status.HTTP_400_BAD_REQUEST
            )

        if len(password) < 8 or len(password) > 1024:
            return Response(
                {"error": "Password must be between 8 and 1024 characters long."},
                status=status.HTTP_400_BAD_REQUEST
            )

        if password != confirm_password:
            return Response(
                {
                    "error": "Password and Confirm Password do not match."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        def required_id(*keys, maximum=9223372036854775807):
            value = next((request.data.get(key) for key in keys if request.data.get(key) not in (None, "")), None)
            if isinstance(value, bool):
                return None
            try:
                parsed = int(value)
            except (TypeError, ValueError):
                return None
            return parsed if 0 < parsed <= maximum else None

        state_id = required_id("state_id", "UM_State_ID", maximum=255)
        range_id = required_id("range_id", "UM_Range_ID")
        if state_id is None or range_id is None:
            return Response(
                {"error": "A valid state ID and range ID are required for RO registration."},
                status=status.HTTP_400_BAD_REQUEST
            )

        optional_ids = {}
        for field, keys in {
            "district_id": ("district_id", "UM_District_ID"),
            "circle_id": ("circle_id", "UM_Circle_ID"),
            "division_id": ("division_id", "UM_Division_ID"),
        }.items():
            value = required_id(*keys)
            if any(request.data.get(key) not in (None, "") for key in keys):
                if value is None:
                    return Response(
                        {"error": f"A valid {field.replace('_', ' ')} is required."},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                optional_ids[field] = value
            else:
                optional_ids[field] = None

        contact_number = request.data.get("contact_number") or request.data.get("UM_MobileNo")
        alternate_contact_number = (
            request.data.get("alternate_contact_number")
            or request.data.get("UM_AlternateMobileNo")
        )
        if any(
            value is not None and not isinstance(value, str)
            for value in (contact_number, alternate_contact_number)
        ):
            return Response(
                {"error": "Contact numbers must be text values."},
                status=status.HTTP_400_BAD_REQUEST
            )
        if any(
            number and len(number) > 15
            for number in (contact_number, alternate_contact_number)
        ):
            return Response(
                {"error": "Contact numbers cannot exceed 15 characters."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # T001 has no identity/default for UM_ID, so allocate and insert while
        # holding a table lock to prevent concurrent registrations reusing an ID.
        from django.contrib.auth.hashers import make_password

        with transaction.atomic():
            with connection.cursor() as cursor:
                cursor.execute(
                    "SELECT ISNULL(MAX(UM_ID), 0) + 1 "
                    "FROM dbo.T001_UserMaster WITH (TABLOCKX, HOLDLOCK)"
                )
                user_id = cursor.fetchone()[0]

                if T001UserMaster.objects.filter(emailid__iexact=emailid).exists():
                    return Response(
                        {"error": "This email ID is already registered."},
                        status=status.HTTP_400_BAD_REQUEST
                    )

                cursor.execute(
                    """
                    INSERT INTO dbo.T001_UserMaster (
                        UM_ID, UM_Project_ID, UM_Level_ID, UM_State_ID,
                        UM_District_ID, UM_Circle_ID, UM_Division_ID, UM_Range_ID,
                        UM_Type, UM_FName, UM_LName, UM_EmailID, UM_Password,
                        UM_Designation_ID, UM_MobileNo, UM_AlternateMobileNo,
                        Language_Code, UM_EntryDate, UM_Approved, UM_Active,
                        UM_Password_Attempted, UM_Password_Set, UM_AC_Blocked,
                        UM_Nodal_officer, UM_Status
                    ) VALUES (
                        %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s,
                        %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s
                    )
                    """,
                    [
                        user_id, 2001, 5, state_id,
                        optional_ids["district_id"], optional_ids["circle_id"],
                        optional_ids["division_id"], range_id,
                        "U", fname, lname, emailid, make_password(password),
                        9, contact_number, alternate_contact_number,
                        99, timezone.now(), "N", "Y", 0, "Y", "N", False, 0,
                    ],
                )

        return Response(
            {
                "message": "RO registration submitted for approval.",
                "user": {
                    "id": user_id,
                    "emailid": emailid,
                    "fname": fname,
                    "lname": lname,
                    "role": "RO",
                }
            },
            status=status.HTTP_201_CREATED
        )


class SilviculturistRegistrationView(APIView):
    def post(self, request):
        emailid = request.data.get("emailid")
        password = request.data.get("password")
        confirm_password = request.data.get("confirm_password")

        if not emailid or not password or not confirm_password:
            return Response(
                {
                    "error": "Email, password and confirm password are required."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        if password != confirm_password:
            return Response(
                {
                    "error": "Password and Confirm Password do not match."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        if CampaSilviculturistUser.objects.filter(emailid=emailid).exists():
            return Response(
                {
                    "error": "This email ID is already registered."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        user = CampaSilviculturistUser(
            user_level="Silviculturist",
            fname=request.data.get("fname"),
            lname=request.data.get("lname"),
            emailid=emailid,
            contact_number=request.data.get("contact_number"),
            alternate_contact_number=request.data.get(
                "alternate_contact_number"
            ),
            designation=request.data.get("designation"),
            role=request.data.get("role", "User"),
            is_active=True
        )

        user.set_password(password)
        user.save()

        return Response(
            {
                "message": "Silviculturist user registered successfully.",
                "user": {
                    "id": user.id,
                    "emailid": user.emailid,
                    "fname": user.fname,
                    "lname": user.lname,
                    "designation": user.designation,
                    "role": user.role
                }
            },
            status=status.HTTP_201_CREATED
        )


class ROLoginView(APIView):
    def post(self, request):
        emailid = request.data.get("userid")
        password = request.data.get("password")

        if (
            not isinstance(emailid, str)
            or not isinstance(password, str)
            or not emailid.strip()
            or not password
        ):
            return Response(
                {
                    "success": False,
                    "error": "Email and password are required."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        emailid = emailid.strip()

        user = T001UserMaster.objects.filter(
            emailid__iexact=emailid,
            level_id=5,
            user_type="U",
        ).first()

        if user is None:
            return Response(
                {
                    "success": False,
                    "error": "Invalid email or password."
                },
                status=status.HTTP_401_UNAUTHORIZED
            )

        if user.active != "Y" or user.account_blocked == "Y":
            return Response(
                {
                    "success": False,
                    "error": "This RO account is inactive or blocked."
                },
                status=status.HTTP_403_FORBIDDEN
            )

        if user.approved != "Y":
            return Response(
                {
                    "success": False,
                    "error": "This RO account is awaiting approval."
                },
                status=status.HTTP_403_FORBIDDEN
            )

        if not user.check_password(password):
            return Response(
                {
                    "success": False,
                    "error": "Invalid email or password."
                },
                status=status.HTTP_401_UNAUTHORIZED
            )

        refresh = RefreshToken.for_user(user)

        full_name = f"{user.fname or ''} {user.lname or ''}".strip()

        return Response(
            {
                "success": True,
                "message": "RO login successful.",
                "refresh": str(refresh),
                "access": str(refresh.access_token),
                "user": {
                    "id": user.id,
                    "userid": user.emailid,
                    "name": full_name,
                    "email": user.emailid,
                    "role": user.role,
                    "user_type": "RO",
                    "designation": user.designation,
                }
            },
            status=status.HTTP_200_OK
        )


class SilviculturistLoginView(APIView):
    def post(self, request):
        emailid = request.data.get("userid")
        password = request.data.get("password")

        if not emailid or not password:
            return Response(
                {
                    "success": False,
                    "error": "Email and password are required."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        emailid = emailid.strip()

        user = CampaSilviculturistUser.objects.filter(
            emailid__iexact=emailid
        ).first()

        if user is None:
            return Response(
                {
                    "success": False,
                    "error": "No Silviculturist user is registered with this email."
                },
                status=status.HTTP_401_UNAUTHORIZED
            )

        if not user.is_active:
            return Response(
                {
                    "success": False,
                    "error": "This Silviculturist account is inactive."
                },
                status=status.HTTP_403_FORBIDDEN
            )

        if not user.check_password(password):
            return Response(
                {
                    "success": False,
                    "error": "Invalid email or password."
                },
                status=status.HTTP_401_UNAUTHORIZED
            )

        refresh = RefreshToken.for_user(user)

        full_name = f"{user.fname or ''} {user.lname or ''}".strip()

        return Response(
            {
                "success": True,
                "message": "Silviculturist login successful.",
                "refresh": str(refresh),
                "access": str(refresh.access_token),
                "user": {
                    "id": user.id,
                    "userid": user.emailid,
                    "name": full_name,
                    "email": user.emailid,
                    "role": user.role,
                    "user_type": "Silviculturist",
                    "designation": user.designation or "",
                }
            },
            status=status.HTTP_200_OK
        )


# class PariveshLoginView(APIView):
#     def post(self, request):
#         username = request.data.get("username")
#         password = request.data.get("password")

#         # Validate username and password
#         if not username or not password:
#             return Response(
#                 {
#                     "success": False,
#                     "error": "Username and password are required."
#                 },
#                 status=status.HTTP_400_BAD_REQUEST
#             )

#         try:
#             import base64

#             # PARIVESH requires the password in Base64 format
#             encoded_password = base64.b64encode(
#                 password.encode("utf-8")
#             ).decode("utf-8")

#             # Call PARIVESH Production API
#             response = requests.post(
#                 settings.PARIVESH_LOGIN_URL,
#                 params={
#                     "secretKey": settings.PARIVESH_SECRET_KEY
#                 },
#                 headers={
#                     "Content-Type": "application/json"
#                 },
#                 json={
#                     "username": username.strip(),
#                     "password": encoded_password
#                 },
#                 timeout=30
#             )

#             # Convert PARIVESH response to JSON
#             parivesh_data = response.json()
#             print("PARIVESH STATUS:", response.status_code)
#             print("PARIVESH RESPONSE:", parivesh_data)

#             # PARIVESH authentication failed
#             if response.status_code != 200:
#                 print("PARIVESH ERROR STATUS:", response.status_code)
#                 print("PARIVESH ERROR RESPONSE:", parivesh_data)

#                 return Response(
#                     {
#                         "success": False,
#                         "parivesh_status": response.status_code,
#                         "parivesh_response": parivesh_data
#                     },
#                     status=response.status_code
#                 )

#             # Get data returned by PARIVESH
#             data = parivesh_data.get("data", {})

#             jwt_token = data.get("jwt")
#             role_names = data.get("roleName", [])

#             # Roles allowed to access Harit-SANKALP
#             allowed_roles = [
#                 "Nodal Officer",
#                 "DFO",
#                 "Divisional Forest Officer (DFO)",
#                 "CF",
#                 "PCCF",
#                 "State Sec",
#                 "National Campa",
#                 "CEO CAMPA"
#             ]

#             # Find an authorized role
#             user_role = None

#             for role in role_names:
#                 if role in allowed_roles:
#                     user_role = role
#                     break

#             # PARIVESH login succeeded but role is not allowed
#             if not user_role:
#                 return Response(
#                     {
#                         "success": False,
#                         "error": (
#                             "Your PARIVESH role is not authorized "
#                             "for Harit-SANKALP."
#                         ),
#                         "parivesh_roles": role_names
#                     },
#                     status=status.HTTP_403_FORBIDDEN
#                 )

#             # Get role/office details
#             role_details = data.get(
#                 "roleNameAbbreviationDtos",
#                 []
#             )

#             selected_office = None

#             for role_detail in role_details:
#                 if role_detail.get("roleName") == user_role:
#                     selected_office = role_detail
#                     break

#             # Successful Harit-SANKALP login
#             return Response(
#                 {
#                     "success": True,
#                     "message": "PARIVESH login successful.",

#                     # PARIVESH tokens
#                     "access": jwt_token,
#                     "refresh": data.get("refreshToken"),

#                     # User information
#                     "user": {
#                         "userid": data.get("userid"),
#                         "username": data.get("username"),
#                         "name": data.get("name"),

#                         # Role information
#                         "role": user_role,
#                         "roleName": role_names,

#                         # User type
#                         "userType": data.get("userType"),

#                         # State information
#                         "stateid": data.get("stateid"),
#                         "stateName": data.get("stateName"),

#                         # Office information
#                         "officeId": (
#                             selected_office.get("officeId")
#                             if selected_office
#                             else None
#                         ),

#                         "officeName": (
#                             selected_office.get("officeName")
#                             if selected_office
#                             else None
#                         ),

#                         "officeTypeId": (
#                             selected_office.get("officeTypeId")
#                             if selected_office
#                             else None
#                         ),

#                         "officeTypeName": (
#                             selected_office.get("officeTypeName")
#                             if selected_office
#                             else None
#                         ),

#                         "officeTypeAbbreviation": (
#                             selected_office.get(
#                                 "officeTypeAbbreviation"
#                             )
#                             if selected_office
#                             else None
#                         ),

#                         "roleAbbreviation": (
#                             selected_office.get(
#                                 "roleAbbreviation"
#                             )
#                             if selected_office
#                             else None
#                         ),

#                         "expiryTime": data.get("expiryTime")
#                     }
#                 },
#                 status=status.HTTP_200_OK
#             )

#         except requests.exceptions.RequestException:
#             return Response(
#                 {
#                     "success": False,
#                     "error": (
#                         "Unable to connect to the PARIVESH server."
#                     )
#                 },
#                 status=status.HTTP_502_BAD_GATEWAY
#             )

#         except ValueError:
#             return Response(
#                 {
#                     "success": False,
#                     "error": (
#                         "Invalid response received from "
#                         "the PARIVESH server."
#                     )
#                 },
#                 status=status.HTTP_502_BAD_GATEWAY
#             )

#         except Exception as e:
#             return Response(
#                 {
#                     "success": False,
#                     "error": (
#                         "An error occurred while processing "
#                         "PARIVESH login."
#                     )
#                 },
#                 status=status.HTTP_500_INTERNAL_SERVER_ERROR
#             )
class PariveshLoginView(APIView):
    def post(self, request):
        username = request.data.get("username")
        password = request.data.get("password")

        if not username or not password:
            return Response(
                {
                    "success": False,
                    "error": "Username and password are required."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        if not settings.PARIVESH_SECRET_KEY:
            return Response(
                {
                    "success": False,
                    "error": "PARIVESH login is not configured."
                },
                status=status.HTTP_503_SERVICE_UNAVAILABLE
            )

        try:
            # import base64

            # encoded_password = base64.b64encode(
            #     password.encode("utf-8")
            # ).decode("utf-8")

            response = requests.post(
                settings.PARIVESH_LOGIN_URL,
                params={
                    "secretKey": settings.PARIVESH_SECRET_KEY
                },
                headers={
                    "Content-Type": "application/json",
                    "Accept": "application/json"
                },
                # json={
                #     "username": username.strip(),
                #     "password": encoded_password
                # },
                json={
                    "username": username.strip(),
                     "password": password
         },
                 timeout=30
            )

            try:
                parivesh_data = response.json()
            except ValueError:
                return Response(
                    {
                        "success": False,
                        "error": "Invalid response received from PARIVESH."
                    },
                    status=status.HTTP_502_BAD_GATEWAY
                )

            print("PARIVESH STATUS:", response.status_code)

            if response.status_code != 200:
                print("PARIVESH ERROR:", parivesh_data)
                return Response(
                    {
                        "success": False,
                        "parivesh_status": response.status_code,
                        "parivesh_response": parivesh_data
                    },
                    status=status.HTTP_502_BAD_GATEWAY
                )

            data = parivesh_data.get("data") or {}
            jwt_token = data.get("jwt")
            role_names = data.get("roleName") or []

            if isinstance(role_names, str):
                role_names = [role_names]

            requested_role = request.data.get("role")
            role_aliases = {
                "national": {"national campa", "ceo campa"},
                "state": {
                    "nodal officer",
                    "pccf",
                    "state sec",
                    "state campa ceo",
                },
                "circle": {"cf"},
                "dfo": {"dfo", "divisional forest officer (dfo)"},
            }
            if requested_role is not None:
                requested_role = (
                    requested_role.strip().lower()
                    if isinstance(requested_role, str)
                    else ""
                )
                if requested_role not in role_aliases:
                    return Response(
                        {
                            "success": False,
                            "error": "A valid Harit-SANKALP role is required."
                        },
                        status=status.HTTP_400_BAD_REQUEST
                    )

            if not jwt_token:
                return Response(
                    {
                        "success": False,
                        "error": "PARIVESH did not return an authentication token."
                    },
                    status=status.HTTP_502_BAD_GATEWAY
                )

            allowed_roles = [
                "Nodal Officer",
                "DFO",
                "Divisional Forest Officer (DFO)",
                "CF",
                "PCCF",
                "State Sec",
                "National Campa",
                "CEO CAMPA",
                "State CAMPA CEO"
            ]

            user_role = next(
                (
                    role for role in role_names
                    if role in allowed_roles
                    and (
                        requested_role is None
                        or role.strip().lower() in role_aliases[requested_role]
                    )
                ),
                None
            )

            if not user_role:
                return Response(
                    {
                        "success": False,
                        "error": "Your PARIVESH account does not have the selected Harit-SANKALP role."
                    },
                    status=status.HTTP_403_FORBIDDEN
                )

            role_details = data.get("roleNameAbbreviationDtos") or []

            selected_office = next(
                (
                    item for item in role_details
                    if item.get("roleName") == user_role
                ),
                None
            )

            return Response(
                {
                    "success": True,
                    "message": "PARIVESH login successful.",
                    "access": jwt_token,
                    "refresh": data.get("refreshToken"),
                    "user": {
                        "userid": data.get("userid"),
                        "username": data.get("username"),
                        "name": data.get("name"),
                        "role": user_role,
                        "roleName": role_names,
                        "userType": data.get("userType"),
                        "stateid": data.get("stateid"),
                        "stateName": data.get("stateName"),
                        "officeId": (
                            selected_office.get("officeId")
                            if selected_office else None
                        ),
                        "officeName": (
                            selected_office.get("officeName")
                            if selected_office else None
                        ),
                        "officeTypeId": (
                            selected_office.get("officeTypeId")
                            if selected_office else None
                        ),
                        "officeTypeName": (
                            selected_office.get("officeTypeName")
                            if selected_office else None
                        ),
                        "officeTypeAbbreviation": (
                            selected_office.get("officeTypeAbbreviation")
                            if selected_office else None
                        ),
                        "roleAbbreviation": (
                            selected_office.get("roleAbbreviation")
                            if selected_office else None
                        ),
                        "expiryTime": data.get("expiryTime")
                    }
                },
                status=status.HTTP_200_OK
            )

        except requests.exceptions.RequestException:
            logger.exception("PARIVESH authentication request failed")
            return Response(
                {
                    "success": False,
                    "error": "Unable to connect to the PARIVESH server."
                },
                status=status.HTTP_502_BAD_GATEWAY
            )

        except Exception:
            logger.exception("PARIVESH login processing failed")
            return Response(
                {
                    "success": False,
                    "error": "An error occurred while processing PARIVESH login."
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )