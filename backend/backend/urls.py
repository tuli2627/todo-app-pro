from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse


def health_check(request):
    return JsonResponse({'success': True, 'status': 'ok'})


urlpatterns = [
    # path('admin/', admin.site.urls),
    path('api/health/', health_check),
    path('api/', include('todos.urls')),
     path('auth/',  include('auth.urls')),  # Add this line to include auth app URLs
]
