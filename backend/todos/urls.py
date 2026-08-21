# from django.urls import path
# from rest_framework.routers import DefaultRouter
# from .views import TodoViewSet, state_wise_nursery_count 

# router = DefaultRouter()
# router.register(r'todos', TodoViewSet)

# urlpatterns = [
#     path('nursery-state-count/', state_wise_nursery_count, name='nursery_state_count'),
# ]

# urlpatterns += router.urls
# from django.urls import path
# from .views import MapDataView  # <-- 1. Add this import at the top

# urlpatterns = [
#     # ... your existing paths ...
    
#     # 2. Add this exact line to your list
#     path('map-data/', MapDataView.as_view()), 
# ]
# from django.urls import path
# from rest_framework.routers import DefaultRouter

# # 1. Combine all your view imports into one line at the top
# from .views import TodoViewSet, state_wise_nursery_count, MapDataView 

# router = DefaultRouter()
# router.register(r'todos', TodoViewSet)

# # 2. Put all your paths into a single urlpatterns list
# urlpatterns = [
#     path('nursery-state-count/', state_wise_nursery_count, name='nursery_state_count'),
#     path('map-data/', MapDataView.as_view(), name='map_data'), 
# ]

# # 3. Add the router urls at the very end
# urlpatterns += router.urls
from django.urls import path
from rest_framework.routers import DefaultRouter

# Import all views from your todos app
from .views import TodoViewSet, state_wise_nursery_count, MapDataView, submit_advance_booking, get_states, get_districts, get_circles, get_divisions

router = DefaultRouter()
router.register(r'todos', TodoViewSet)

urlpatterns = [
    path('nursery-state-count/', state_wise_nursery_count, name='nursery_state_count'),
    path('map-data/', MapDataView.as_view(), name='map_data'), 
    
    # NEW ADVANCE BOOKING ROUTES
    path('advance-booking/', submit_advance_booking, name='submit_advance_booking'),
    path('states/', get_states, name='get_states'),
    path('districts/', get_districts, name='get_districts'),
    path('circles/', get_circles, name='get_circles'),
    path('divisions/', get_divisions, name='get_divisions'),
]

urlpatterns += router.urls
