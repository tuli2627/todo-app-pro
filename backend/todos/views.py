from rest_framework import viewsets
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from django.db.models import Count, F

# Apne models aur serializers import karo
from .models import Todo, T007Nursery 
from .serializers import TodoSerializer 

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