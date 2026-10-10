
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
from .workflow import (
    workflow_decision,
    workflow_lookups,
    workflow_overview,
    workflow_records,
    workflow_record_detail,
    workflow_technical_review,
    workflow_users,
    workflow_admin_users,
    workflow_admin_silviculturists,
    workflow_admin_masters,
    workflow_admin_directory,
    workflow_admin_lookups,
)
from .progress_workflow import (
    workflow_progress_dashboard,
    workflow_progress_sites,
    workflow_progress_reports,
    workflow_progress_report_detail,
    workflow_technical_assessment,
    workflow_site_technical_assessments,
)
from .chatbot import chatbot_message
from .public_dashboard import (
    public_dashboard_summary,
    public_nurseries,
    public_progress_dashboard,
)

router = DefaultRouter()
router.register(r'todos', TodoViewSet)

urlpatterns = [
    path('workflow/overview/', workflow_overview, name='workflow_overview'),
    path('workflow/lookups/', workflow_lookups, name='workflow_lookups'),
    path('workflow/users/', workflow_users, name='workflow_users'),
    path('workflow/admin/lookups/', workflow_admin_lookups, name='workflow_admin_lookups'),
    path('workflow/admin/users/', workflow_admin_users, name='workflow_admin_users'),
    path(
        'workflow/admin/silviculturists/',
        workflow_admin_silviculturists,
        name='workflow_admin_silviculturists',
    ),
    path('workflow/admin/masters/<slug:master>/', workflow_admin_masters, name='workflow_admin_masters'),
    path('workflow/admin/directory/', workflow_admin_directory, name='workflow_admin_directory'),
    path('workflow/records/<slug:module>/', workflow_records, name='workflow_records'),
    path(
        'workflow/records/<slug:module>/<int:record_id>/',
        workflow_record_detail,
        name='workflow_record_detail',
    ),
    path(
        'workflow/records/<slug:module>/<int:record_id>/decision/',
        workflow_decision,
        name='workflow_decision',
    ),
    path(
        'workflow/records/<slug:module>/<int:record_id>/technical-review/',
        workflow_technical_review,
        name='workflow_technical_review',
    ),
    path('workflow/progress/dashboard/', workflow_progress_dashboard, name='workflow_progress_dashboard'),
    path('public-dashboard/summary/', public_dashboard_summary, name='public_dashboard_summary'),
    path('public-dashboard/progress/', public_progress_dashboard, name='public_progress_dashboard'),
    path('public-dashboard/nurseries/', public_nurseries, name='public_nurseries'),
    path('chatbot/message/', chatbot_message, name='chatbot_message'),
    path('workflow/progress/sites/', workflow_progress_sites, name='workflow_progress_sites'),
    path('workflow/progress/reports/', workflow_progress_reports, name='workflow_progress_reports'),
    path(
        'workflow/progress/reports/<int:report_id>/',
        workflow_progress_report_detail,
        name='workflow_progress_report_detail',
    ),
    path(
        'workflow/progress/reports/<int:report_id>/assessment/',
        workflow_technical_assessment,
        name='workflow_technical_assessment',
    ),
    path(
        'workflow/progress/site-assessments/',
        workflow_site_technical_assessments,
        name='workflow_site_technical_assessments',
    ),
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
