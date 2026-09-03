# from rest_framework import serializers
# from .models import Todo


# class TodoSerializer(serializers.ModelSerializer):
#     class Meta:
#         model = Todo
#         fields = ['id', 'title', 'completed', 'created_at', 'updated_at']
#         read_only_fields = ['id', 'created_at', 'updated_at']

#     def validate_title(self, value):
#         if not value.strip():
#             raise serializers.ValidationError("Title can't be empty.")
#         return value.strip()
# class LoginSerializer(serializers.Serializer):
#     email = serializers.EmailField()
#     password = serializers.CharField(write_only=True)
# from rest_framework import serializers
# from .models import Todo, T030AdvanceBooking, M001State, M002District, M002Circle, M003Division, T007Nursery
# class TodoSerializer(serializers.ModelSerializer):
#     class Meta:
#         model = Todo
#         fields = ['id', 'title', 'completed', 'created_at', 'updated_at']
#         read_only_fields = ['id', 'created_at', 'updated_at']

#     def validate_title(self, value):
#         if not value.strip():
#             raise serializers.ValidationError("Title can't be empty.")
#         return value.strip()

# class LoginSerializer(serializers.Serializer):
#     email = serializers.EmailField()
#     password = serializers.CharField(write_only=True)


# # --- ADDED FOR ADVANCE BOOKING ---
# class T030AdvanceBookingSerializer(serializers.ModelSerializer):
#     class Meta:
#         model = T030AdvanceBooking
#         fields = '__all__'


# # --- ADDED FOR STATE DROPDOWN ---
# class M001StateSerializer(serializers.ModelSerializer):
#     class Meta:
#         model = M001State
#         fields = ['state_id', 'state_name', 'state_code']

# # --- ADDED FOR DISTRICT DROPDOWN ---
# class M002DistrictSerializer(serializers.ModelSerializer):
#     class Meta:
#         model = M002District
#         # Make sure these field names match your Django models.py exact casing!
#         fields = ['district_id', 'district_name', 'district_state_id']
# class M002CircleSerializer(serializers.ModelSerializer):
#     class Meta:
#         model = M002Circle
#         fields = ['circle_id', 'circle_name', 'circle_state_id'] 
# class M003DivisionSerializer(serializers.ModelSerializer):
#     class Meta:
#         model = M003Division
#         fields = ['division_id', 'division_name', 'division_circle_id']
# # --- ADDED FOR MAP NURSERY DETAILS ---
# class NurseryDetailSerializer(serializers.ModelSerializer):
#     print("Initializing NurseryDetailSerializer")  # Debugging line
#     print(f"Model fields: {[field.name for field in T007Nursery._meta.get_fields()]}")  # Debugging line
#     id = serializers.IntegerField(source='nursery_id', read_only=True)
#     name = serializers.CharField(source='nursery_name', default='')
#     address = serializers.CharField(source='nursery_address', default='')
#     location = serializers.CharField(source='nursery_location', default='')
#     phone = serializers.CharField(source='nursery_contact_person_phone', default='')
#     contact_person = serializers.CharField(source='nursery_contact_person_name', default='')
#     photoUrl = serializers.CharField(source='Nursery_PHOTO', default='')

#     class Meta:
#         model = T007Nursery
#         fields = ['id', 'name', 'address', 'location', 'phone', 'contact_person', 'photoUrl']
# from rest_framework import serializers
# from .models import Todo, T030AdvanceBooking, M001State, M002District, M002Circle, M003Division, T007Nursery

# class TodoSerializer(serializers.ModelSerializer):
#     class Meta:
#         model = Todo
#         fields = ['id', 'title', 'completed', 'created_at', 'updated_at']
#         read_only_fields = ['id', 'created_at', 'updated_at']

#     def validate_title(self, value):
#         if not value.strip():
#             raise serializers.ValidationError("Title can't be empty.")
#         return value.strip()


# class LoginSerializer(serializers.Serializer):
#     email = serializers.EmailField()
#     password = serializers.CharField(write_only=True)


# # --- ADVANCE BOOKING ---
# class T030AdvanceBookingSerializer(serializers.ModelSerializer):
#     class Meta:
#         model = T030AdvanceBooking
#         fields = '__all__'


# # --- STATE DROPDOWN ---
# class M001StateSerializer(serializers.ModelSerializer):
#     class Meta:
#         model = M001State
#         fields = ['state_id', 'state_name', 'state_code']


# # --- DISTRICT DROPDOWN ---
# class M002DistrictSerializer(serializers.ModelSerializer):
#     class Meta:
#         model = M002District
#         fields = ['district_id', 'district_name', 'district_state_id']


# # --- CIRCLE DROPDOWN ---
# class M002CircleSerializer(serializers.ModelSerializer):
#     class Meta:
#         model = M002Circle
#         fields = ['circle_id', 'circle_name', 'circle_state_id']


# # --- DIVISION DROPDOWN ---
# class M003DivisionSerializer(serializers.ModelSerializer):
#     class Meta:
#         model = M003Division
#         fields = ['division_id', 'division_name', 'division_circle_id']


# # --- MAP NURSERY DETAILS ---
# class NurseryDetailSerializer(serializers.ModelSerializer):
#     id = serializers.IntegerField(source='nursery_id', read_only=True)
#     name = serializers.CharField(source='nursery_name', default='')
#     address = serializers.SerializerMethodField()
#     location = serializers.SerializerMethodField()
#     phone = serializers.SerializerMethodField()
#     contact_person = serializers.SerializerMethodField()
#     photo_url = serializers.SerializerMethodField()
#     photoUrl = serializers.SerializerMethodField()  # CamelCase alias for frontend compatibility

#     class Meta:
#         model = T007Nursery
#         fields = [
#             'id', 
#             'name', 
#             'address', 
#             'location', 
#             'phone', 
#             'contact_person', 
#             'photo_url', 
#             'photoUrl'
#         ]

#     def get_address(self, obj):
#         return getattr(obj, 'nursery_address', getattr(obj, 'nursery_location', '')) or ''

#     def get_location(self, obj):
#         return getattr(obj, 'nursery_location', getattr(obj, 'nursery_address', '')) or ''

#     def get_phone(self, obj):
#         return (
#             getattr(obj, 'nursery_contact_person_phone', None) or 
#             getattr(obj, 'nursery_phone', None) or 
#             getattr(obj, 'nursery_mobile', '') or 
#             ''
#         )

#     def get_contact_person(self, obj):
#         return getattr(obj, 'nursery_contact_person_name', getattr(obj, 'nursery_maintainby', '')) or ''

#     def get_photo_url(self, obj):
#         # Extract photo path across potential column casing/naming
#         raw_photo = (
#             getattr(obj, 'Nursery_PHOTO', None) or 
#             getattr(obj, 'nursery_photo', None) or 
#             getattr(obj, 'ab_photo', None)
#         )

#         if not raw_photo:
#             return None

#         clean_path = str(raw_photo).strip().replace('\\', '/')
        
#         # Ensure correct relative media prefix
#         if not clean_path.startswith('/'):
#             clean_path = f"/{clean_path}"

#         request = self.context.get('request')
#         if request is not None:
#             # Resolves to http://127.0.0.1:8000/media/Uploads/NUR/...
#             return request.build_absolute_uri(f"/media{clean_path}")

#         return f"http://127.0.0.1:8000/media{clean_path}"

#     def get_photoUrl(self, obj):
#         return self.get_photo_url(obj)
from rest_framework import serializers
from .models import Todo, T030AdvanceBooking, M001State, M002District, M002Circle, M003Division, T007Nursery

class TodoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Todo
        fields = ['id', 'title', 'completed', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']

    def validate_title(self, value):
        if not value.strip():
            raise serializers.ValidationError("Title can't be empty.")
        return value.strip()


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)


# --- ADVANCE BOOKING ---
class T030AdvanceBookingSerializer(serializers.ModelSerializer):
    class Meta:
        model = T030AdvanceBooking
        fields = '__all__'


# --- STATE DROPDOWN ---
class M001StateSerializer(serializers.ModelSerializer):
    class Meta:
        model = M001State
        fields = ['state_id', 'state_name', 'state_code']


# --- DISTRICT DROPDOWN ---
class M002DistrictSerializer(serializers.ModelSerializer):
    class Meta:
        model = M002District
        fields = ['district_id', 'district_name', 'district_state_id']


# --- CIRCLE DROPDOWN ---
class M002CircleSerializer(serializers.ModelSerializer):
    class Meta:
        model = M002Circle
        fields = ['circle_id', 'circle_name', 'circle_state_id']


# --- DIVISION DROPDOWN ---
class M003DivisionSerializer(serializers.ModelSerializer):
    class Meta:
        model = M003Division
        fields = ['division_id', 'division_name', 'division_circle_id']


# --- MAP NURSERY DETAILS ---
class NurseryDetailSerializer(serializers.ModelSerializer):
    id = serializers.SerializerMethodField()
    name = serializers.SerializerMethodField()
    address = serializers.SerializerMethodField()
    location = serializers.SerializerMethodField()
    phone = serializers.SerializerMethodField()
    contact_person = serializers.SerializerMethodField()
    photo_url = serializers.SerializerMethodField()
    photoUrl = serializers.SerializerMethodField()  # CamelCase alias for frontend compatibility

    class Meta:
        model = T007Nursery
        fields = [
            'id', 
            'name', 
            'address', 
            'location', 
            'phone', 
            'contact_person', 
            'photo_url', 
            'photoUrl'
        ]

    def _get_val(self, obj, field_list):
        """Helper to safely fetch attributes regardless of casing or dict/model instance."""
        for field in field_list:
            val = getattr(obj, field, None)
            if val is not None and str(val).strip() != "":
                return str(val).strip()
            if isinstance(obj, dict) and field in obj and obj[field]:
                return str(obj[field]).strip()
        return ""

    def get_id(self, obj):
        return self._get_val(obj, ['Nursery_ID', 'nursery_id', 'id'])

    def get_name(self, obj):
        return self._get_val(obj, ['Nursery_Name', 'nursery_name', 'name'])

    def get_address(self, obj):
        return self._get_val(obj, ['Nursery_Address', 'nursery_address', 'Nursery_Location', 'nursery_location'])

    def get_location(self, obj):
        return self._get_val(obj, ['Nursery_Location', 'nursery_location', 'Nursery_Address', 'nursery_address'])

    def get_phone(self, obj):
        return self._get_val(obj, ['Nursery_Contact_Person_Phone', 'nursery_contact_person_phone', 'nursery_phone', 'phone'])

    def get_contact_person(self, obj):
        return self._get_val(obj, ['Nursery_Contact_Person_Name', 'nursery_contact_person_name', 'Nursery_MaintainBy', 'nursery_maintainby'])

    def get_photo_url(self, obj):
        # Extract photo path matching exact SQL Server column casing [Nursery_PHOTO]
        raw_photo = self._get_val(obj, [
            'Nursery_PHOTO', 
            'nursery_photo', 
            'Nursery_Photo', 
            'ab_photo'
        ])

        if not raw_photo:
            return None

        # Clean Windows path backslashes (Uploads\NUR\... -> Uploads/NUR/...)
        clean_path = raw_photo.replace('\\', '/')
        if not clean_path.startswith('/'):
            clean_path = f"/{clean_path}"

        request = self.context.get('request')
        if request is not None:
            # Resolves to http://127.0.0.1:8000/media/Uploads/NUR/...
            return request.build_absolute_uri(f"/media{clean_path}")

        return f"http://127.0.0.1:8000/media{clean_path}"

    def get_photoUrl(self, obj):
        return self.get_photo_url(obj)