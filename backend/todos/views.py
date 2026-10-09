
# import base64
# import time
# from django.core.files.base import ContentFile
# from django.core.files.storage import default_storage
# from django.db import connection
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
# # @api_view(['GET'])
# # @permission_classes([AllowAny])
# # def get_states(request):
# #     """
# #     Return only the columns required by the frontend.
# #     Uses values() so Django does not try to load unrelated
# #     SQL Server columns from M001_State.
# #     """
# #     try:
# #         states = (
# #             M001State.objects
# #             .values(
# #                 'state_id',
# #                 'state_name',
# #                 'state_code'
# #             )
# #             .order_by('state_name')
# #         )

# #         return Response(list(states))

# #     except Exception as e:
# #         print("GET STATES ERROR:", str(e))
# #         return Response(
# #             {
# #                 "error": "Unable to load states",
# #                 "details": str(e)
# #             },
# #             status=500
# #         )


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


# # =========================================================
# # 7. Species List API View (NEW)
# # =========================================================
# @api_view(['GET'])
# @permission_classes([AllowAny])
# def get_species_list(request):
#     """
#     Fetches top 1000 records from [dbOSTPM].[dbo].[M007_Species] table.
#     """
#     query = """
#         SELECT TOP (1000) 
#             [Species_ID],
#             [Species_Name],
#             [Species_S_Name],
#             [Species_Active],
#             [Species_EntryBy],
#             [Species_EntryOn],
#             [Species_UpdatedBy],
#             [Species_UpdatedOn],
#             [Species_POWO]
#         FROM [dbOSTPM].[dbo].[M007_Species]
#     """
#     try:
#         with connection.cursor() as cursor:
#             cursor.execute(query)
#             columns = [col[0] for col in cursor.description]
#             data = [dict(zip(columns, row)) for row in cursor.fetchall()]

#         return Response(data)
#     except Exception as e:
#         return Response({"error": str(e)}, status=500)
import base64
import time
from urllib.error import HTTPError, URLError
from urllib.parse import unquote, urlsplit
from urllib.request import HTTPRedirectHandler, Request, build_opener

from django.http import HttpResponse
from django.core.files.base import ContentFile
from django.core.files.storage import default_storage
from django.db import connection
from django.db.models import Count, F, Q
from django.utils import timezone
from rest_framework import viewsets, status # <-- Added status here
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAdminUser
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import (
    Todo, 
    T007Nursery, 
    T030AdvanceBooking, 
    M001State, 
    M002District, 
    M002Circle, 
    M003Division,
    M004Range,
    M003SubDistrict,
    M004Block,
    M005Section,
    M006Compartment
)
from .serializers import (
    TodoSerializer, 
    M001StateSerializer, 
    M002DistrictSerializer, 
    M003SubDistrictSerializer,
    M002CircleSerializer, 
    M003DivisionSerializer, 
    M004RangeSerializer,
    M004BlockSerializer,
    NurseryDetailSerializer,
    M005SectionSerializer, 
    M006CompartmentSerializer
)


# =========================================================
# 1. Todo ViewSet
# =========================================================
class TodoViewSet(viewsets.ModelViewSet):
    queryset = Todo.objects.all()
    serializer_class = TodoSerializer
    permission_classes = [IsAdminUser]


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


@api_view(['GET'])
@permission_classes([AllowAny])
def dashboard_chart_data(request):
    """Group active nursery counts by state/district, deriving species matches from bookings."""
    if request.query_params.get('height_range'):
        return Response(
            {"error": "Height filtering is unavailable until nursery height data is configured."},
            status=400
        )

    filter_ids = {}
    for parameter in ('state_id', 'district_id', 'species_id'):
        value = request.query_params.get(parameter)
        if not value:
            filter_ids[parameter] = None
            continue

        try:
            filter_id = int(value)
        except (TypeError, ValueError):
            return Response({"error": f"{parameter} must be a positive integer."}, status=400)

        if filter_id <= 0:
            return Response({"error": f"{parameter} must be a positive integer."}, status=400)
        filter_ids[parameter] = filter_id

    state_id = filter_ids['state_id']
    district_id = filter_ids['district_id']
    species_id = filter_ids['species_id']

    if district_id and not state_id:
        return Response({"error": "state_id is required when filtering by district."}, status=400)

    if state_id and not M001State.objects.filter(state_id=state_id).exists():
        return Response({"error": "The selected state was not found."}, status=400)

    district_names = {}
    if state_id:
        district_rows = M002District.objects.filter(
            district_state_id=state_id
        ).values('district_id', 'district_name')
        district_names = {row['district_id']: row['district_name'] for row in district_rows}

        if district_id and district_id not in district_names:
            return Response(
                {"error": "The selected district does not belong to the selected state."},
                status=400
            )

    if species_id:
        records = T030AdvanceBooking.objects.filter(
            ab_active__in=['Y', '1'],
            ab_species_id=species_id,
            ab_nursery__nursery_active__in=['Y', '1']
        )
        if state_id:
            records = records.filter(ab_state_id=state_id)
        if district_id:
            records = records.filter(ab_district_id=district_id)

        if state_id:
            grouped = records.values('ab_district_id').annotate(
                nursery_count=Count('ab_nursery_id', distinct=True)
            ).order_by('ab_district_id')
            items = [
                {
                    'name': district_names.get(row['ab_district_id'], 'Unassigned'),
                    'value': row['nursery_count']
                }
                for row in grouped
            ]
        else:
            grouped = records.values(
                'ab_state__state_name'
            ).annotate(
                nursery_count=Count('ab_nursery_id', distinct=True)
            ).order_by('ab_state__state_name')
            items = [
                {'name': row['ab_state__state_name'], 'value': row['nursery_count']}
                for row in grouped
            ]
    else:
        records = T007Nursery.objects.filter(nursery_active__in=['Y', '1'])
        if state_id:
            records = records.filter(nursery_state_id=state_id)
        if district_id:
            records = records.filter(nursery_district_id=district_id)

        if state_id:
            grouped = records.values('nursery_district_id').annotate(
                nursery_count=Count('nursery_id')
            ).order_by('nursery_district_id')
            items = [
                {
                    'name': district_names.get(row['nursery_district_id'], 'Unassigned'),
                    'value': row['nursery_count']
                }
                for row in grouped
            ]
        else:
            grouped = records.values(
                'nursery_state__state_name'
            ).annotate(
                nursery_count=Count('nursery_id')
            ).order_by('nursery_state__state_name')
            items = [
                {'name': row['nursery_state__state_name'], 'value': row['nursery_count']}
                for row in grouped
            ]

    return Response({"items": items})


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
# =========================================================
# Sub-District Dropdown API
# =========================================================
@api_view(['GET'])
@permission_classes([AllowAny])
def get_subdistricts(request):
    district_id = request.GET.get('district_id')

    if not district_id:
        return Response(
            {"error": "district_id parameter is required"},
            status=400
        )

    try:
        subdistricts = M003SubDistrict.objects.filter(
            subdistrict_district_id=district_id
        ).order_by('subdistrict_name')

        serializer = M003SubDistrictSerializer(
            subdistricts,
            many=True
        )

        return Response(serializer.data)

    except Exception as e:
        return Response({"error": str(e)}, status=500)
# =========================================================
# Block Dropdown API
# =========================================================
# =========================================================
# Block Dropdown API
# =========================================================
@api_view(['GET'])
@permission_classes([AllowAny])
def get_blocks(request):
    district_id = request.GET.get('district_id')

    if not district_id:
        return Response(
            {"error": "district_id parameter is required"},
            status=400
        )

    try:
        blocks = M004Block.objects.filter(
            district_code=district_id
        ).order_by('block_name')

        serializer = M004BlockSerializer(
            blocks,
            many=True
        )

        return Response(serializer.data)

    except Exception as e:
        return Response(
            {"error": str(e)},
            status=500
        )



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
# Forest Range Dropdown API
# =========================================================
@api_view(['GET'])
@permission_classes([AllowAny])
def get_ranges(request):
    division_id = request.GET.get('division_id')

    if not division_id:
        return Response(
            {"error": "division_id parameter is required"},
            status=400
        )

    try:
        ranges = M004Range.objects.filter(
            range_division_id=division_id
        ).order_by('range_name')

        serializer = M004RangeSerializer(
            ranges,
            many=True
        )

        return Response(serializer.data)

    except Exception as e:
        return Response(
            {"error": str(e)},
            status=500
        )
@api_view(['GET'])
@permission_classes([AllowAny])
def get_sections(request):
    range_id = request.GET.get('range_id')

    if not range_id:
        return Response(
            {"error": "range_id parameter is required"},
            status=400
        )

    try:
        sections = M005Section.objects.filter(
            section_range_id=range_id
        ).order_by('section_name')

        serializer = M005SectionSerializer(
            sections,
            many=True
        )

        return Response(serializer.data)

    except Exception as e:
        return Response(
            {"error": str(e)},
            status=500
        )
@api_view(['GET'])
@permission_classes([AllowAny])
def get_compartments(request):
    section_id = request.GET.get('section_id')

    if not section_id:
        return Response(
            {"error": "section_id parameter is required"},
            status=400
        )

    try:
        compartments = M006Compartment.objects.filter(
            compart_section_id=section_id
        ).order_by('compart_name')

        serializer = M006CompartmentSerializer(
            compartments,
            many=True
        )

        return Response(serializer.data)

    except Exception as e:
        return Response(
            {"error": str(e)},
            status=500
        )


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

    if state_id_param and state_id_param.isdigit():
        state = M001State.objects.filter(state_id=int(state_id_param)).first()

    if not state and state_name_param:
        state = M001State.objects.filter(
            Q(state_name__iexact=state_name_param) | 
            Q(state_name__icontains=state_name_param)
        ).first()

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

    if not state:
        fallback_name = state_name_param or state_code_param or "Unknown State"
        return Response({'stateId': None, 'stateName': fallback_name, 'total': 0, 'nurseries': []})

    nurseries = T007Nursery.objects.filter(
        nursery_state_id=state.state_id,
        nursery_active__in=['Y', '1']
    )

    serializer = NurseryDetailSerializer(nurseries, many=True, context={'request': request})

    return Response({
        'stateId': state.state_id,
        'stateName': state.state_name,
        'total': nurseries.count(),
        'nurseries': serializer.data
    })


# =========================================================
# Nursery KML file proxy
# =========================================================

NURSERY_KML_HOST = 'nationalcampa.nic.in'
NURSERY_KML_BASE_PATH = '/Harit-SANKALP/Uploads/NUR/'
NURSERY_KML_MAX_BYTES = 5 * 1024 * 1024


class _NurseryKmlRedirectHandler(HTTPRedirectHandler):
    def redirect_request(self, request, file_pointer, code, message, headers, new_url):
        destination = urlsplit(new_url)
        destination_path = unquote(destination.path).lower()
        if (
            destination.scheme != 'https'
            or destination.hostname != NURSERY_KML_HOST
            or not destination_path.startswith(NURSERY_KML_BASE_PATH.lower())
            or not destination_path.endswith('.kml')
        ):
            return None
        return super().redirect_request(
            request, file_pointer, code, message, headers, new_url
        )


def _get_nursery_kml_source_url(raw_path):
    parsed = urlsplit(str(raw_path).strip().replace('\\', '/'))
    if parsed.query or parsed.fragment:
        raise ValueError('KML path cannot include a query or fragment.')

    if parsed.scheme or parsed.netloc:
        if parsed.scheme != 'https' or parsed.hostname != NURSERY_KML_HOST:
            raise ValueError('KML source must use the configured nursery host.')
        path = unquote(parsed.path)
    else:
        path = unquote(parsed.path).replace('~/', '', 1).lstrip('/')
        path_lower = path.lower()
        if path_lower.startswith('media/uploads/nur/'):
            path = path[len('media/'):]
            path_lower = path.lower()
        if path_lower.startswith('harit-sankalp/uploads/nur/'):
            path = path[len('Harit-SANKALP/'):]
            path_lower = path.lower()
        if not path_lower.startswith('uploads/nur/'):
            raise ValueError('KML path must be inside Uploads/NUR.')
        path = f'/{path}'

    path_lower = path.lower()
    allowed_prefix = NURSERY_KML_BASE_PATH.lower()
    if not path_lower.startswith(allowed_prefix):
        if path_lower.startswith('/uploads/nur/'):
            path = f'/Harit-SANKALP{path}'
        else:
            raise ValueError('KML path must be inside Uploads/NUR.')

    relative_path = path[len(NURSERY_KML_BASE_PATH):]
    segments = relative_path.split('/')
    if (
        not relative_path.lower().endswith('.kml')
        or not relative_path
        or any(segment in {'', '.', '..'} for segment in segments)
    ):
        raise ValueError('KML path must name a KML file inside Uploads/NUR.')

    return f'https://{NURSERY_KML_HOST}{NURSERY_KML_BASE_PATH}{relative_path}'


@api_view(['GET'])
@permission_classes([AllowAny])
def get_nursery_kml(request, nursery_id):
    nursery = T007Nursery.objects.filter(
        nursery_id=nursery_id,
        nursery_active__in=['Y', '1']
    ).first()
    if nursery is None:
        return Response({'detail': 'Nursery not found.'}, status=status.HTTP_404_NOT_FOUND)

    if not nursery.nursery_kmlurl:
        return Response({'detail': 'This nursery has no KML file.'}, status=status.HTTP_404_NOT_FOUND)

    try:
        source_url = _get_nursery_kml_source_url(nursery.nursery_kmlurl)
    except ValueError as error:
        return Response({'detail': str(error)}, status=status.HTTP_400_BAD_REQUEST)

    source_request = Request(
        source_url,
        headers={
            'Accept': 'application/vnd.google-earth.kml+xml, application/xml, text/xml',
            'User-Agent': 'HaritSankalp/1.0'
        }
    )
    opener = build_opener(_NurseryKmlRedirectHandler())
    try:
        with opener.open(source_request, timeout=8) as source_response:
            kml_content = source_response.read(NURSERY_KML_MAX_BYTES + 1)
    except HTTPError as error:
        return Response(
            {'detail': f'KML source returned HTTP {error.code}.'},
            status=status.HTTP_502_BAD_GATEWAY
        )
    except (URLError, TimeoutError) as error:
        return Response(
            {'detail': f'Unable to retrieve the nursery KML: {error.reason if isinstance(error, URLError) else error}'},
            status=status.HTTP_502_BAD_GATEWAY
        )

    if len(kml_content) > NURSERY_KML_MAX_BYTES:
        return Response(
            {'detail': 'Nursery KML exceeds the 5 MB size limit.'},
            status=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE
        )

    response = HttpResponse(
        kml_content,
        content_type='application/vnd.google-earth.kml+xml'
    )
    response['Content-Disposition'] = f'inline; filename="nursery-{nursery_id}.kml"'
    response['Cache-Control'] = 'private, max-age=60'
    response['X-Content-Type-Options'] = 'nosniff'
    return response


# =========================================================
# 7. Species List API View 
# =========================================================
@api_view(['GET'])
@permission_classes([AllowAny])
def get_species_list(request):
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


# =========================================================
# 8. Nursery Registration API View (NEW)
# =========================================================
class NurseryRegisterView(APIView):
    permission_classes = [AllowAny] # Using AllowAny for easy testing from React right now

    def post(self, request):
        data = request.data
        
        try:
            # Foreign Key Handling: 
            # For testing with simple text inputs, we just grab the first state in your DB to prevent FK crashes.
            # Once we build the dropdowns, this will be swapped to find the exact state ID.
            default_state = M001State.objects.first()
            
            if not default_state:
                return Response({"error": "No states found in database. Please add one first."}, status=status.HTTP_400_BAD_REQUEST)

            new_nursery = T007Nursery.objects.create(
                nursery_state=default_state, 
                nursery_name=data.get('nurseryName', 'Test Nursery'),
                nursery_address=data.get('address', ''),
                
                # Convert string distance to a number (default to 0 if blank)
                nursery_distance=float(data.get('distance') or 0), 
                
                nursery_contact_person_name=data.get('contactName', ''),
                nursery_contact_person_phone=data.get('contactNo', ''),
                nursery_active='Y'
            )
            
            return Response(
                {"message": "Nursery registered successfully!", "nursery_id": new_nursery.nursery_id}, 
                status=status.HTTP_201_CREATED
            )
            
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)