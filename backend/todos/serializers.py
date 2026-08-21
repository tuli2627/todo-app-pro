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
from rest_framework import serializers
from .models import Todo, T030AdvanceBooking, M001State, M002District, M002Circle, M003Division
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


# --- ADDED FOR ADVANCE BOOKING ---
class T030AdvanceBookingSerializer(serializers.ModelSerializer):
    class Meta:
        model = T030AdvanceBooking
        fields = '__all__'


# --- ADDED FOR STATE DROPDOWN ---
class M001StateSerializer(serializers.ModelSerializer):
    class Meta:
        model = M001State
        fields = ['state_id', 'state_name', 'state_code']

# --- ADDED FOR DISTRICT DROPDOWN ---
class M002DistrictSerializer(serializers.ModelSerializer):
    class Meta:
        model = M002District
        # Make sure these field names match your Django models.py exact casing!
        fields = ['district_id', 'district_name', 'district_state_id']
class M002CircleSerializer(serializers.ModelSerializer):
    class Meta:
        model = M002Circle
        fields = ['circle_id', 'circle_name', 'circle_state_id']
class M003DivisionSerializer(serializers.ModelSerializer):
    class Meta:
        model = M003Division
        fields = ['division_id', 'division_name', 'division_circle_id']