
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
    get_subdistricts,
    get_circles, 
    get_divisions,
    get_ranges,
    get_blocks,
    get_sections,
    get_compartments,
    get_state_nursery_details,
    get_nursery_kml,
    get_species_list,
    dashboard_chart_data
)

router = DefaultRouter()
router.register(r'todos', TodoViewSet)

urlpatterns = [
    path('dashboard-chart-data/', dashboard_chart_data, name='dashboard_chart_data'),
    path('nursery-state-count/', state_wise_nursery_count, name='nursery_state_count'),
    path('map-data/', MapDataView.as_view(), name='map_data'), 
    
    # NEW ROUTE FOR STATE MAP DETAILS
    path('nurseries/state-details/', get_state_nursery_details, name='get_state_nursery_details'),
    path('nurseries/<int:nursery_id>/kml/', get_nursery_kml, name='nursery_kml'),
    
    # ADVANCE BOOKING ROUTES
    path('advance-booking/', submit_advance_booking, name='submit_advance_booking'),
    path('states/', get_states, name='get_states'),
    path('districts/', get_districts, name='get_districts'),
    path('subdistricts/', get_subdistricts, name='get_subdistricts'),
    path('blocks/', get_blocks, name='get_blocks'),
    path('circles/', get_circles, name='get_circles'),
    path('divisions/', get_divisions, name='get_divisions'),
    path('ranges/', get_ranges, name='get_ranges'),
    path('sections/', get_sections, name='get_sections'),
    path('compartments/', get_compartments, name='get_compartments'),

    # SPECIES ROUTE
    path('species/', get_species_list, name='get_species_list'),
]

# Include router URLs
urlpatterns += router.urls

# Serve media files in development environment (for nursery photos/uploads)
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
