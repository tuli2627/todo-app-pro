
# from django.urls import path
# from django.conf import settings
# from django.conf.urls.static import static
# from rest_framework.routers import DefaultRouter

# from .views import (
#     TodoViewSet, 
#     state_wise_nursery_count, 
#     MapDataView, 
#     submit_advance_booking, 
#     get_states, 
#     get_districts, 
#     get_circles, 
#     get_divisions,
#     get_state_nursery_details
# )

# router = DefaultRouter()
# router.register(r'todos', TodoViewSet)

# urlpatterns = [
#     path('nursery-state-count/', state_wise_nursery_count, name='nursery_state_count'),
#     path('map-data/', MapDataView.as_view(), name='map_data'), 
    
#     # NEW ROUTE FOR STATE MAP DETAILS
#     path('nurseries/state-details/', get_state_nursery_details, name='get_state_nursery_details'),
    
#     # ADVANCE BOOKING ROUTES
#     path('advance-booking/', submit_advance_booking, name='submit_advance_booking'),
#     path('states/', get_states, name='get_states'),
#     path('districts/', get_districts, name='get_districts'),
#     path('circles/', get_circles, name='get_circles'),
#     path('divisions/', get_divisions, name='get_divisions'),
# ]

# # Include router URLs
# urlpatterns += router.urls

# # Serve media files in development environment (for nursery photos/uploads)
# if settings.DEBUG:
#     urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
from django.urls import path
from django.conf import settings
from django.conf.urls.static import static
from rest_framework.routers import DefaultRouter

from .views import (
    TodoViewSet, 
    state_wise_nursery_count, 
    MapDataView, 
    submit_advance_booking, 
    get_states, 
    get_districts, 
    get_circles, 
    get_divisions,
    get_state_nursery_details,
    get_species_list
)

router = DefaultRouter()
router.register(r'todos', TodoViewSet)

urlpatterns = [
    path('nursery-state-count/', state_wise_nursery_count, name='nursery_state_count'),
    path('map-data/', MapDataView.as_view(), name='map_data'), 
    
    # NEW ROUTE FOR STATE MAP DETAILS
    path('nurseries/state-details/', get_state_nursery_details, name='get_state_nursery_details'),
    
    # ADVANCE BOOKING ROUTES
    path('advance-booking/', submit_advance_booking, name='submit_advance_booking'),
    path('states/', get_states, name='get_states'),
    path('districts/', get_districts, name='get_districts'),
    path('circles/', get_circles, name='get_circles'),
    path('divisions/', get_divisions, name='get_divisions'),

    # SPECIES ROUTE
    path('species/', get_species_list, name='get_species_list'),
]

# Include router URLs
urlpatterns += router.urls

# Serve media files in development environment (for nursery photos/uploads)
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)