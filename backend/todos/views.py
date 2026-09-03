
# import base64
# import time
# from django.core.files.base import ContentFile
# from django.core.files.storage import default_storage
# from django.db.models import Count, F, Q
# from django.utils import timezone
# from rest_framework import viewsets
# from rest_framework.decorators import api_view, permission_classes
# from rest_framework.permissions import AllowAny
# from rest_framework.response import Response
# from rest_framework.views import APIView

# from .models import (
#     Todo, 
#     T007Nursery, 
#     T030AdvanceBooking, 
#     M001State, 
#     M002District, 
#     M002Circle, 
#     M003Division
# )
# from .serializers import (
#     TodoSerializer, 
#     M001StateSerializer, 
#     M002DistrictSerializer, 
#     M002CircleSerializer, 
#     M003DivisionSerializer, 
#     NurseryDetailSerializer
# )


# # =========================================================
# # 1. Todo ViewSet
# # =========================================================
# class TodoViewSet(viewsets.ModelViewSet):
#     queryset = Todo.objects.all()
#     serializer_class = TodoSerializer


# # =========================================================
# # 2. State-Wise Nursery Count API
# # =========================================================
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


# # =========================================================
# # 3. Map Data API View
# # =========================================================
# class MapDataView(APIView):
#     permission_classes = [AllowAny]

#     def get(self, request):
#         try:
#             states = M001State.objects.annotate(
#                 active_nurseries_count=Count('t007nursery', filter=Q(t007nursery__nursery_active='1'))
#             )

#             data = []
#             for state in states:
#                 code = state.state_code.strip() if state.state_code else ""
#                 if code and not code.startswith("IN-"):
#                     code = f"IN-{code}"

#                 data.append({
#                     "state_code": code,
#                     "state_id": state.state_id,
#                     "state_name": state.state_name,
#                     "nurseries_count": state.active_nurseries_count
#                 })

#             return Response(data)
#         except Exception as e:
#             return Response({"error": str(e)}, status=500)


# # =========================================================
# # 4. Advance Booking API View
# # =========================================================
# @api_view(['POST'])
# @permission_classes([AllowAny])
# def submit_advance_booking(request):
#     data = request.data
    
#     # 1. Process the Base64 Image
#     image_data = data.get('receiptImage')
#     saved_filename = "no_image.jpg"
    
#     if image_data and ';base64,' in image_data:
#         format, imgstr = image_data.split(';base64,') 
#         ext = format.split('/')[-1] 
        
#         # Create a unique filename using a timestamp
#         saved_filename = f"receipt_{int(time.time())}.{ext}"
        
#         # Decode and save the actual image file to your Django media folder
#         file_data = ContentFile(base64.b64decode(imgstr), name=saved_filename)
#         default_storage.save(saved_filename, file_data)

#     # 2. Save data to the SQL Server Database
#     try:
#         new_booking = T030AdvanceBooking(
#             ab_uniquecode=f"AB{int(time.time())}",
#             ab_state_id=data.get('state'), 
#             ab_district_id=data.get('district') or 1,
#             ab_division_id=data.get('forestDivision') or 1,
#             ab_soldto='NA', 
#             ab_govttype=data.get('type')[:2] if data.get('type') else 'NA',
#             ab_name=data.get('name'),
#             ab_staff_name=data.get('contactPersonName'),
#             ab_staff_contact=data.get('contactPersonNo'),
#             ab_nursery_id=data.get('nurseryName') or 1, 
#             ab_species_id=data.get('species') or 1,
#             ab_plant_no=data.get('noOfPlants') or 0,
#             ab_date_avaiable=data.get('availableDate'),
#             ab_amount=data.get('amount') or 0.00,
#             ab_photo=saved_filename,
#             ab_active='Y',
#             ab_entryby=1,
#             ab_entryon=timezone.now()
#         )
#         new_booking.save(using='default')
        
#         return Response({"message": "Booking saved successfully!"}, status=201)
    
#     except Exception as e:
#         return Response({"error": str(e)}, status=400)


# # =========================================================
# # 5. Dropdown API Views
# # =========================================================
# @api_view(['GET'])
# @permission_classes([AllowAny])
# def get_states(request):
#     try:
#         states = M001State.objects.all().order_by('state_name')
#         serializer = M001StateSerializer(states, many=True)
#         return Response(serializer.data)
#     except Exception as e:
#         return Response({"error": str(e)}, status=500)


# @api_view(['GET'])
# @permission_classes([AllowAny])
# def get_districts(request):
#     state_id = request.GET.get('state_id')
    
#     if not state_id:
#         return Response({"error": "state_id parameter is required"}, status=400)
        
#     try:
#         districts = M002District.objects.filter(district_state_id=state_id).order_by('district_name')
#         serializer = M002DistrictSerializer(districts, many=True)
#         return Response(serializer.data)
#     except Exception as e:
#         return Response({"error": str(e)}, status=500)


# @api_view(['GET'])
# @permission_classes([AllowAny])
# def get_circles(request):
#     state_id = request.GET.get('state_id')
    
#     if not state_id:
#         return Response({"error": "state_id parameter is required"}, status=400)
        
#     try:
#         circles = M002Circle.objects.filter(circle_state_id=state_id).order_by('circle_name')
#         serializer = M002CircleSerializer(circles, many=True)
#         return Response(serializer.data)
#     except Exception as e:
#         return Response({"error": str(e)}, status=500)


# @api_view(['GET'])
# @permission_classes([AllowAny])
# def get_divisions(request):
#     circle_id = request.GET.get('circle_id')
#     if not circle_id:
#         return Response({"error": "circle_id parameter is required"}, status=400)
#     try:
#         divisions = M003Division.objects.filter(division_circle_id=circle_id).order_by('division_name')
#         serializer = M003DivisionSerializer(divisions, many=True)
#         return Response(serializer.data)
#     except Exception as e:
#         return Response({"error": str(e)}, status=500)


# # =========================================================
# # 6. State Nursery Details API View
# # =========================================================
# @api_view(['GET'])
# @permission_classes([AllowAny])
# def get_state_nursery_details(request):
#     state_id_param = request.GET.get('state_id', '').strip()
#     state_name_param = request.GET.get('state_name', '').strip()
#     state_code_param = request.GET.get('stateCode', '').strip() or request.GET.get('code', '').strip()

#     state = None

#     # 1. Lookup by numeric state_id
#     if state_id_param and state_id_param.isdigit():
#         state = M001State.objects.filter(state_id=int(state_id_param)).first()

#     # 2. Fallback: Lookup by state_name
#     if not state and state_name_param:
#         state = M001State.objects.filter(
#             Q(state_name__iexact=state_name_param) | 
#             Q(state_name__icontains=state_name_param)
#         ).first()

#     # 3. Fallback: Lookup by state_code / raw code
#     if not state and state_code_param:
#         clean_code = state_code_param.replace("IN-", "").strip()
#         state = M001State.objects.filter(
#             Q(state_code__iexact=state_code_param) |
#             Q(state_code__iexact=clean_code) |
#             Q(state_name__iexact=clean_code) |
#             Q(state_name__icontains=clean_code)
#         ).first()

#         if not state and clean_code.isdigit():
#             state = M001State.objects.filter(state_id=int(clean_code)).first()

#     # If no state record is found, return zero results gracefully
#     if not state:
#         fallback_name = state_name_param or state_code_param or "Unknown State"
#         return Response({'stateId': None, 'stateName': fallback_name, 'total': 0, 'nurseries': []})

#     # Query T007Nursery using the resolved state's ID
#     nurseries = T007Nursery.objects.filter(
#         nursery_state_id=state.state_id,
#         nursery_active__in=['Y', '1']
#     )

#     # Pass request context so image links build into full URL paths
#     serializer = NurseryDetailSerializer(nurseries, many=True, context={'request': request})

#     return Response({
#         'stateId': state.state_id,
#         'stateName': state.state_name,
#         'total': nurseries.count(),
#         'nurseries': serializer.data
#     })
import base64
import time
from django.core.files.base import ContentFile
from django.core.files.storage import default_storage
from django.db import connection
from django.db.models import Count, F, Q
from django.utils import timezone
from rest_framework import viewsets
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import (
    Todo, 
    T007Nursery, 
    T030AdvanceBooking, 
    M001State, 
    M002District, 
    M002Circle, 
    M003Division
)
from .serializers import (
    TodoSerializer, 
    M001StateSerializer, 
    M002DistrictSerializer, 
    M002CircleSerializer, 
    M003DivisionSerializer, 
    NurseryDetailSerializer
)


# =========================================================
# 1. Todo ViewSet
# =========================================================
class TodoViewSet(viewsets.ModelViewSet):
    queryset = Todo.objects.all()
    serializer_class = TodoSerializer


# =========================================================
# 2. State-Wise Nursery Count API
# =========================================================
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


# =========================================================
# 3. Map Data API View
# =========================================================
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
        new_booking = T030AdvanceBooking(
            ab_uniquecode=f"AB{int(time.time())}",
            ab_state_id=data.get('state'), 
            ab_district_id=data.get('district') or 1,
            ab_division_id=data.get('forestDivision') or 1,
            ab_soldto='NA', 
            ab_govttype=data.get('type')[:2] if data.get('type') else 'NA',
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
            ab_entryby=1,
            ab_entryon=timezone.now()
        )
        new_booking.save(using='default')
        
        return Response({"message": "Booking saved successfully!"}, status=201)
    
    except Exception as e:
        return Response({"error": str(e)}, status=400)


# =========================================================
# 5. Dropdown API Views
# =========================================================
@api_view(['GET'])
@permission_classes([AllowAny])
def get_states(request):
    try:
        states = M001State.objects.all().order_by('state_name')
        serializer = M001StateSerializer(states, many=True)
        return Response(serializer.data)
    except Exception as e:
        return Response({"error": str(e)}, status=500)


@api_view(['GET'])
@permission_classes([AllowAny])
def get_districts(request):
    state_id = request.GET.get('state_id')
    
    if not state_id:
        return Response({"error": "state_id parameter is required"}, status=400)
        
    try:
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
# 6. State Nursery Details API View
# =========================================================
@api_view(['GET'])
@permission_classes([AllowAny])
def get_state_nursery_details(request):
    state_id_param = request.GET.get('state_id', '').strip()
    state_name_param = request.GET.get('state_name', '').strip()
    state_code_param = request.GET.get('stateCode', '').strip() or request.GET.get('code', '').strip()

    state = None

    # 1. Lookup by numeric state_id
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

        if not state and clean_code.isdigit():
            state = M001State.objects.filter(state_id=int(clean_code)).first()

    # If no state record is found, return zero results gracefully
    if not state:
        fallback_name = state_name_param or state_code_param or "Unknown State"
        return Response({'stateId': None, 'stateName': fallback_name, 'total': 0, 'nurseries': []})

    # Query T007Nursery using the resolved state's ID
    nurseries = T007Nursery.objects.filter(
        nursery_state_id=state.state_id,
        nursery_active__in=['Y', '1']
    )

    # Pass request context so image links build into full URL paths
    serializer = NurseryDetailSerializer(nurseries, many=True, context={'request': request})

    return Response({
        'stateId': state.state_id,
        'stateName': state.state_name,
        'total': nurseries.count(),
        'nurseries': serializer.data
    })


# =========================================================
# 7. Species List API View (NEW)
# =========================================================
@api_view(['GET'])
@permission_classes([AllowAny])
def get_species_list(request):
    """
    Fetches top 1000 records from [dbOSTPM].[dbo].[M007_Species] table.
    """
    query = """
        SELECT TOP (1000) 
            [Species_ID],
            [Species_Name],
            [Species_S_Name],
            [Species_Active],
            [Species_EntryBy],
            [Species_EntryOn],
            [Species_UpdatedBy],
            [Species_UpdatedOn],
            [Species_POWO]
        FROM [dbOSTPM].[dbo].[M007_Species]
    """
    try:
        with connection.cursor() as cursor:
            cursor.execute(query)
            columns = [col[0] for col in cursor.description]
            data = [dict(zip(columns, row)) for row in cursor.fetchall()]

        return Response(data)
    except Exception as e:
        return Response({"error": str(e)}, status=500)