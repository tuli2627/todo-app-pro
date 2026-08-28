# from rest_framework import viewsets
# from rest_framework.decorators import api_view, permission_classes
# from rest_framework.permissions import AllowAny
# from rest_framework.response import Response
# from django.db.models import Count, F

# # Apne models aur serializers import karo
# from .models import Todo, T007Nursery 
# from .serializers import TodoSerializer 

# # 1. Tumhara purana TodoViewSet (Jo delete ho gaya tha)
# class TodoViewSet(viewsets.ModelViewSet):
#     queryset = Todo.objects.all()
#     serializer_class = TodoSerializer

# # 2. Tumhari nayi Nursery Count API
# @api_view(['GET'])
# @permission_classes([AllowAny])
# def state_wise_nursery_count(request):
#     try:
#         data = T007Nursery.objects.values(
#             State_ID=F('nursery_state__state_id'), 
#             State_Name=F('nursery_state__state_name'), 
#             State_Code=F('nursery_state__state_id')  
#         ).annotate(
#             Nursery_Count=Count('nursery_id'),
#             Total_Nursery=Count('nursery_id')  
#         ).order_by('State_Name')
        
#         return Response(data)
        
#     except Exception as e:
#         return Response({"error": str(e)}, status=500)
#     from rest_framework.views import APIView
# from rest_framework.response import Response

# class MapDataView(APIView):
#     def get(self, request):
#         # 1. Hardcoded data (Use this right now to test if the map works)
#         # Later, you can replace this with a Database query like: 
#         # data = Nursery.objects.values('state_code').annotate(nurseries_count=Count('id'))
        
#         data = [
#             {"state_code": "IN-AN", "nurseries_count": 13},
#             {"state_code": "IN-AR", "nurseries_count": 3},
#             {"state_code": "IN-GJ", "nurseries_count": 299},
#             {"state_code": "IN-HP", "nurseries_count": 27},
#             {"state_code": "IN-JK", "nurseries_count": 49},
#             {"state_code": "IN-KA", "nurseries_count": 206},
#             {"state_code": "IN-MP", "nurseries_count": 40},
#             {"state_code": "IN-MN", "nurseries_count": 50},
#             {"state_code": "IN-MZ", "nurseries_count": 46},
#             {"state_code": "IN-PB", "nurseries_count": 33},
#             {"state_code": "IN-RJ", "nurseries_count": 6},
#             {"state_code": "IN-SK", "nurseries_count": 7},
#             {"state_code": "IN-TG", "nurseries_count": 77},
#             {"state_code": "IN-TR", "nurseries_count": 8},
#             {"state_code": "IN-WB", "nurseries_count": 3},
#         ]
#         return Response(data)
# from rest_framework import viewsets
# from rest_framework.views import APIView  # <-- Moved to the top
# from rest_framework.decorators import api_view, permission_classes
# from rest_framework.permissions import AllowAny
# from rest_framework.response import Response
# from django.db.models import Count, F

# # Apne models aur serializers import karo
# from .models import Todo, T007Nursery 
# from .serializers import TodoSerializer 

# # 1. Tumhara purana TodoViewSet (Jo delete ho gaya tha)
# class TodoViewSet(viewsets.ModelViewSet):
#     queryset = Todo.objects.all()
#     serializer_class = TodoSerializer

# # 2. Tumhari nayi Nursery Count API
# @api_view(['GET'])
# @permission_classes([AllowAny])
# def state_wise_nursery_count(request):
#     try:
#         data = T007Nursery.objects.values(
#             State_ID=F('nursery_state__state_id'), 
#             State_Name=F('nursery_state__state_name'), 
#             State_Code=F('nursery_state__state_id')  
#         ).annotate(
#             Nursery_Count=Count('nursery_id'),
#             Total_Nursery=Count('nursery_id')  
#         ).order_by('State_Name')
        
#         return Response(data)
        
#     except Exception as e:
#         return Response({"error": str(e)}, status=500)


# # 3. Tumhara Map Data View
# class MapDataView(APIView):
#     def get(self, request):
#         # 1. Hardcoded data (Use this right now to test if the map works)
#         # Later, you can replace this with a Database query like: 
#         # data = Nursery.objects.values('state_code').annotate(nurseries_count=Count('id'))
        
#         data = [
#             {"state_code": "IN-AN", "nurseries_count": 13},
#             {"state_code": "IN-AR", "nurseries_count": 3},
#             {"state_code": "IN-GJ", "nurseries_count": 299},
#             {"state_code": "IN-HP", "nurseries_count": 27},
#             {"state_code": "IN-JK", "nurseries_count": 49},
#             {"state_code": "IN-KA", "nurseries_count": 206},
#             {"state_code": "IN-MP", "nurseries_count": 40},
#             {"state_code": "IN-MN", "nurseries_count": 50},
#             {"state_code": "IN-MZ", "nurseries_count": 46},
#             {"state_code": "IN-PB", "nurseries_count": 33},
#             {"state_code": "IN-RJ", "nurseries_count": 6},
#             {"state_code": "IN-SK", "nurseries_count": 7},
#             {"state_code": "IN-TG", "nurseries_count": 77},
#             {"state_code": "IN-TR", "nurseries_count": 8},
#             {"state_code": "IN-WB", "nurseries_count": 3},
#         ]
#         return Response(data)
from rest_framework import viewsets
from rest_framework.views import APIView  # <-- Moved to the top
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from django.db.models import Count, F, Q

# --- NEW IMPORTS ADDED FOR ADVANCE BOOKING ---
import base64
import time
from django.core.files.base import ContentFile
from django.core.files.storage import default_storage
from django.utils import timezone
# ---------------------------------------------

# Apne models aur serializers import karo (Added T030AdvanceBooking and M001State)
from .models import Todo, T007Nursery, T030AdvanceBooking, M001State, M002District, M002Circle, M003Division
from .serializers import TodoSerializer, M001StateSerializer, M002DistrictSerializer, M002CircleSerializer, M003DivisionSerializer, NurseryDetailSerializer

# 1. Tumhara purana TodoViewSet (Jo delete ho gaya tha)
class TodoViewSet(viewsets.ModelViewSet):
    queryset = Todo.objects.all()
    serializer_class = TodoSerializer

# 2. Tumhari nayi Nursery Count API
@api_view(['GET'])
@permission_classes([AllowAny])
def state_wise_nursery_count(request):
    try:
        data = T007Nursery.objects.values(
            State_ID=F('nursery_state__state_id'), 
            State_Name=F('nursery_state__state_name'), 
            State_Code=F('nursery_state__state_id')  
        ).annotate(
            Nursery_Count=Count('nursery_id'),
            Total_Nursery=Count('nursery_id')  
        ).order_by('State_Name')
        
        return Response(data)
        
    except Exception as e:
        return Response({"error": str(e)}, status=500)


class MapDataView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        try:
            states = M001State.objects.annotate(
                active_nurseries_count=Count('t007nursery', filter=Q(t007nursery__nursery_active='1'))
            )

            data = []
            for state in states:
                code = state.state_code.strip() if state.state_code else ""
                if code and not code.startswith("IN-"):
                    code = f"IN-{code}"

                data.append({
                    "state_code": code,
                    "state_id": state.state_id,
                    "state_name": state.state_name,
                    "nurseries_count": state.active_nurseries_count
                })

            return Response(data)
        except Exception as e:
            return Response({"error": str(e)}, status=500)
# =========================================================
# 4. Advance Booking API View
# =========================================================
@api_view(['POST'])
@permission_classes([AllowAny])
def submit_advance_booking(request):
    data = request.data
    
    # 1. Process the Base64 Image
    image_data = data.get('receiptImage')
    saved_filename = "no_image.jpg"
    
    if image_data and ';base64,' in image_data:
        format, imgstr = image_data.split(';base64,') 
        ext = format.split('/')[-1] 
        
        # Create a unique filename using a timestamp
        saved_filename = f"receipt_{int(time.time())}.{ext}"
        
        # Decode and save the actual image file to your Django media folder
        file_data = ContentFile(base64.b64decode(imgstr), name=saved_filename)
        default_storage.save(saved_filename, file_data)

    # 2. Save data to the SQL Server Database
    try:
        # Create a new record mapping the JSON data to your DB columns
        new_booking = T030AdvanceBooking(
            ab_uniquecode=f"AB{int(time.time())}", # Generating a random unique code
            ab_state_id=data.get('state'), 
            ab_district_id=data.get('district') or 1,
            ab_division_id=data.get('forestDivision') or 1,
            ab_soldto='NA', # Required by DB (char 2)
            ab_govttype=data.get('type')[:2] if data.get('type') else 'NA', # Takes first 2 letters to fit char(2)
            ab_name=data.get('name'),
            ab_staff_name=data.get('contactPersonName'),
            ab_staff_contact=data.get('contactPersonNo'),
            ab_nursery_id=data.get('nurseryName') or 1, 
            ab_species_id=data.get('species') or 1,
            ab_plant_no=data.get('noOfPlants') or 0,
            ab_date_avaiable=data.get('availableDate'),
            ab_amount=data.get('amount') or 0.00,
            ab_photo=saved_filename,
            ab_active='Y',
            ab_entryby=1, # Default admin user ID
            ab_entryon=timezone.now()
        )
        new_booking.save(using='default')
        
        return Response({"message": "Booking saved successfully!"}, status=201)
    
    except Exception as e:
        return Response({"error": str(e)}, status=400)


# =========================================================
# 5. NEW: State Dropdown API View
# =========================================================
@api_view(['GET'])
@permission_classes([AllowAny])
def get_states(request):
    try:
        # Fetch all states and order them alphabetically by name
        states = M001State.objects.all().order_by('state_name')
        serializer = M001StateSerializer(states, many=True)
        return Response(serializer.data)
    except Exception as e:
        return Response({"error": str(e)}, status=500)
@api_view(['GET'])
@permission_classes([AllowAny])
def get_districts(request):
    # Get the state_id from the URL (e.g., /api/districts/?state_id=36)
    state_id = request.GET.get('state_id')
    
    if not state_id:
        return Response({"error": "state_id parameter is required"}, status=400)
        
    try:
        # Filter districts by the selected state and sort them alphabetically
        districts = M002District.objects.filter(district_state_id=state_id).order_by('district_name')
        serializer = M002DistrictSerializer(districts, many=True)
        return Response(serializer.data)
    except Exception as e:
        return Response({"error": str(e)}, status=500)
@api_view(['GET'])
@permission_classes([AllowAny])
def get_circles(request):
    state_id = request.GET.get('state_id')
    
    if not state_id:
        return Response({"error": "state_id parameter is required"}, status=400)
        
    try:
        circles = M002Circle.objects.filter(circle_state_id=state_id).order_by('circle_name')
        serializer = M002CircleSerializer(circles, many=True)
        return Response(serializer.data)
    except Exception as e:
        return Response({"error": str(e)}, status=500)
@api_view(['GET'])
@permission_classes([AllowAny])
def get_divisions(request):
    circle_id = request.GET.get('circle_id')
    if not circle_id:
        return Response({"error": "circle_id parameter is required"}, status=400)
    try:
        divisions = M003Division.objects.filter(division_circle_id=circle_id).order_by('division_name')
        serializer = M003DivisionSerializer(divisions, many=True)
        return Response(serializer.data)
    except Exception as e:
        return Response({"error": str(e)}, status=500)
# =========================================================
# State Nursery Modal Details Endpoint
# =========================================================
# @api_view(['GET'])
# @permission_classes([AllowAny])
# def get_state_nursery_details(request):
#     """
#     Returns nursery list for the requested state_code (e.g., /api/nurseries/state-details/?stateCode=IN-GJ)
#     """
#     raw_code = request.GET.get('stateCode', '').strip()

#     if not raw_code:
#         return Response({'stateName': '', 'total': 0, 'nurseries': []})

#     # Clean 'IN-' prefix (e.g., 'IN-KA' -> 'KA')
#     clean_code = raw_code.replace("IN-", "").strip()

#     # Search flexibly across state_code, clean code, or state_name
#     state = M001State.objects.filter(
#         Q(state_code__iexact=raw_code) |
#         Q(state_code__iexact=clean_code) |
#         Q(state_name__iexact=clean_code)
#     ).first()

#     # Fallback search if state ID was passed numerically
#     if not state and clean_code.isdigit():
#         state = M001State.objects.filter(state_id=int(clean_code)).first()

#     if not state:
#         return Response({'stateName': raw_code, 'total': 0, 'nurseries': []})

#     # Fetch active nurseries linked to the found state
#     nurseries = T007Nursery.objects.filter(
#         nursery_state=state,
#         nursery_active='1'
#     )

#     serializer = NurseryDetailSerializer(nurseries, many=True)

#     return Response({
#         'stateName': state.state_name,
#         'total': nurseries.count(),
#         'nurseries': serializer.data
#     })
# @api_view(['GET'])
# @permission_classes([AllowAny])
# def get_state_nursery_details(request):
#     raw_code = request.GET.get('stateCode', '').strip()

#     if not raw_code:
#         return Response({'stateName': '', 'total': 0, 'nurseries': []})

#     clean_code = raw_code.replace("IN-", "").strip()

#     # 1. Get exact State_ID from M001_State table
#     state = M001State.objects.filter(
#         Q(state_code__iexact=raw_code) |
#         Q(state_code__iexact=clean_code) |
#         Q(state_name__iexact=clean_code) |
#         Q(state_name__icontains=clean_code)
#     ).first()

#     # Fallback search if numeric ID is passed directly
#     if not state and clean_code.isdigit():
#         state = M001State.objects.filter(state_id=int(clean_code)).first()

#     if not state:
#         return Response({'stateName': raw_code, 'total': 0, 'nurseries': []})

#     # 2. Query dbo.T007_Nursery directly using state.state_id (State_ID)
#     nurseries = T007Nursery.objects.filter(
#         nursery_state_id=state.state_id,
#         nursery_active__in=['Y', '1']
#     )

#     serializer = NurseryDetailSerializer(nurseries, many=True)
#     print(f"Found {nurseries.count()} nurseries for state: {state.state_name} (ID: {state.state_id})")
#     print(f"Serialized data: {serializer.data[:5]}")  # Print first 5 nurseries for debugging
#     print(f"{nurseries}")
#     return Response({
#         'stateId': state.state_id,
#         'stateName': state.state_name,
#         'total': nurseries.count(),
#         'nurseries': serializer.data
#     })
@api_view(['GET'])
@permission_classes([AllowAny])
def get_state_nursery_details(request):
    # Extract all possible query parameters passed from frontend/React
    state_id_param = request.GET.get('state_id', '').strip()
    state_name_param = request.GET.get('state_name', '').strip()
    state_code_param = request.GET.get('stateCode', '').strip() or request.GET.get('code', '').strip()

    state = None

    # 1. Lookup by numeric state_id if available
    if state_id_param and state_id_param.isdigit():
        state = M001State.objects.filter(state_id=int(state_id_param)).first()

    # 2. Fallback: Lookup by state_name
    if not state and state_name_param:
        state = M001State.objects.filter(
            Q(state_name__iexact=state_name_param) | 
            Q(state_name__icontains=state_name_param)
        ).first()

    # 3. Fallback: Lookup by state_code / raw code
    if not state and state_code_param:
        clean_code = state_code_param.replace("IN-", "").strip()
        state = M001State.objects.filter(
            Q(state_code__iexact=state_code_param) |
            Q(state_code__iexact=clean_code) |
            Q(state_name__iexact=clean_code) |
            Q(state_name__icontains=clean_code)
        ).first()

        # Check if the code passed was numeric
        if not state and clean_code.isdigit():
            state = M001State.objects.filter(state_id=int(clean_code)).first()

    # If no state record found, return zero results gracefully
    if not state:
        fallback_name = state_name_param or state_code_param or "Unknown State"
        return Response({'stateId': None, 'stateName': fallback_name, 'total': 0, 'nurseries': []})

    # Query T007Nursery using the resolved state's ID
    nurseries = T007Nursery.objects.filter(
        nursery_state_id=state.state_id,
        nursery_active__in=['Y', '1']
    )

    serializer = NurseryDetailSerializer(nurseries, many=True)

    return Response({
        'stateId': state.state_id,
        'stateName': state.state_name,
        'total': nurseries.count(),
        'nurseries': serializer.data
    })
    
    if hasattr(T007Nursery, 'nursery_active'):
        nurseries = nurseries.filter(
            Q(nursery_active='Y') | Q(nursery_active='1')
        )

    serializer = NurseryDetailSerializer(nurseries, many=True)

    return Response({
        'stateName': state.state_name,
        'total': nurseries.count(),
        'nurseries': serializer.data
    })